interface StructuredMoaPrimitive {
  readonly id: string;
  readonly properties: Record<string, string>;
}

const STRUCTURED_MOA_NODE_PATTERN =
  /^\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*StructuredMoA\s*{([^}]*)}\s*\)\s*$/;
const EDGE_PATTERN =
  /^\(([^)]+)\)\s*-\[:([A-Z]+)(?:\s*{([^}]*)})?\]->\s*\(([^)]+)\)\s*$/;
const ARRAY_LITERAL_PATTERN = /^\[(.*)\]$/;

function parseProperties(propertiesRaw: string): Record<string, string> {
  if (!propertiesRaw) {
    return {};
  }

  const properties: Record<string, string> = {};
  const pairs = propertiesRaw.match(
    /(\w+)\s*:\s*('[^']*'|"[^"]*"|\[[^\]]*\]|[^,]+)/g
  );
  if (!pairs) {
    return properties;
  }

  for (const pair of pairs) {
    const separator = pair.indexOf(':');
    if (separator < 0) {
      continue;
    }

    const key = pair.slice(0, separator).trim();
    const value = pair
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');

    if (key.length > 0 && value.length > 0) {
      properties[key] = value;
    }
  }

  return properties;
}

function parsePositiveInt(
  rawValue: string | undefined,
  fallback: number
): number {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

function parseNameList(rawValue: string | undefined): readonly string[] {
  if (!rawValue) {
    return [];
  }

  const match = rawValue.match(ARRAY_LITERAL_PATTERN);
  if (!match) {
    return [];
  }

  return match[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
    .filter((entry) => entry.length > 0);
}

function parseStructuredMoaPrimitive(
  line: string
): StructuredMoaPrimitive | null {
  const match = line.match(STRUCTURED_MOA_NODE_PATTERN);
  if (!match) {
    return null;
  }

  const id = match[1]?.trim();
  const propertiesRaw = match[2]?.trim() ?? '';
  if (!id) {
    return null;
  }

  return {
    id,
    properties: parseProperties(propertiesRaw),
  };
}

function normalizeTargetSegment(
  segment: string,
  primitiveIds: ReadonlySet<string>
): string {
  const trimmed = segment.trim();
  const idMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
  const id = idMatch?.[1];
  if (!id || !primitiveIds.has(id)) {
    return segment;
  }

  const replacement = `${id}__ingress`;
  return segment.replace(id, replacement);
}

function rewriteIncomingPrimitiveTargets(
  line: string,
  primitiveIds: ReadonlySet<string>
): string {
  const match = line.match(EDGE_PATTERN);
  if (!match) {
    return line;
  }

  const sourceRaw = match[1]?.trim() ?? '';
  const edgeType = match[2]?.trim() ?? '';
  const propertiesRaw = match[3]?.trim();
  const targetRaw = match[4]?.trim() ?? '';
  const rewrittenTargets = targetRaw
    .split('|')
    .map((segment) => normalizeTargetSegment(segment, primitiveIds))
    .join(' | ');

  const renderedProperties =
    propertiesRaw && propertiesRaw.length > 0 ? ` { ${propertiesRaw} }` : '';

  return `(${sourceRaw})-[:${edgeType}${renderedProperties}]->(${rewrittenTargets})`;
}

function renderPrimitiveProperties(
  properties: Readonly<Record<string, string>>
): string {
  const entries = Object.entries(properties);
  if (entries.length === 0) {
    return '';
  }

  return ` { ${entries
    .map(([key, value]) => `${key}: '${value}'`)
    .join(', ')} }`;
}

function expandStructuredMoaPrimitive(
  primitive: StructuredMoaPrimitive
): readonly string[] {
  const blocks = parsePositiveInt(primitive.properties.blocks, 4);
  const activeBlocks = Math.min(
    blocks,
    parsePositiveInt(
      primitive.properties.activeBlocks ?? primitive.properties.active_blocks,
      2
    )
  );
  const heads = parsePositiveInt(primitive.properties.heads, 4);
  const activeHeads = Math.min(
    heads,
    parsePositiveInt(
      primitive.properties.activeHeads ?? primitive.properties.active_heads,
      2
    )
  );
  const stages = parsePositiveInt(primitive.properties.stages, 4);
  const chunks = parsePositiveInt(primitive.properties.chunks, 2);
  const blockParameters = String(
    parsePositiveInt(primitive.properties.parameters, 18)
  );
  const headParameters = String(
    parsePositiveInt(primitive.properties.headParameters, 4)
  );
  const blockLabel = primitive.properties.blockLabel ?? 'MoATransformerlet';
  const headLabel = primitive.properties.headLabel ?? 'AttentionHeadChain';
  const outputLabel = primitive.properties.outputLabel ?? 'Tensor';
  const family = primitive.properties.family ?? 'moa';
  const innerFoldStrategy =
    primitive.properties.innerFoldStrategy ??
    primitive.properties.headFoldStrategy ??
    'linear';
  const outerFoldStrategy =
    primitive.properties.outerFoldStrategy ??
    primitive.properties.strategy ??
    'linear';
  const blockNames = parseNameList(primitive.properties.blockNames);
  const resolvedBlockNames =
    blockNames.length === blocks
      ? blockNames
      : Array.from(
          { length: blocks },
          (_, index) => `${primitive.id}__block_${index}`
        );
  const outputProperties = renderPrimitiveProperties({
    primitive: 'StructuredMoA',
    blocks: String(blocks),
    active_blocks: String(activeBlocks),
    heads: String(heads),
    active_heads: String(activeHeads),
    family,
  });

  const lines: string[] = [];
  lines.push(
    `// StructuredMoA '${primitive.id}' expanded into rotated concurrent MoA topology.`
  );
  lines.push(
    `(${primitive.id}__ingress: FlowFrame { role: 'structured-moa-ingress', primitive: 'StructuredMoA' })`
  );
  lines.push(
    `(${primitive.id}__outer_rotation: RotationScheduler { schedule: 'wallington_rotation', stages: '${stages}', chunks: '${chunks}', role: 'outer-transformer-rotation' })`
  );
  lines.push(
    `(${primitive.id}__router: RoutingGate { transformerlets: '${blocks}', active_paths: '${activeBlocks}', role: 'outer-moa-router' })`
  );
  lines.push(`(${primitive.id}: ${outputLabel}${outputProperties})`);
  lines.push(
    `(${primitive.id}__ingress)-[:PROCESS]->(${primitive.id}__outer_rotation)`
  );
  lines.push(
    `(${primitive.id}__outer_rotation)-[:FORK { schedule: 'wallington_rotation' }]->(${primitive.id}__router)`
  );
  lines.push(
    `(${primitive.id}__router)-[:FORK]->(${resolvedBlockNames.join(' | ')})`
  );

  const blockOutputs: string[] = [];
  for (const [blockIndex, blockName] of resolvedBlockNames.entries()) {
    const headRotation = `${blockName}__head_rotation`;
    const headRouter = `${blockName}__head_router`;
    const headWhip = `${blockName}__head_whip`;
    const blockOut = `${blockName}__out`;
    const headNames = Array.from(
      { length: heads },
      (_, headIndex) => `${blockName}__h${headIndex}`
    );
    blockOutputs.push(blockOut);

    lines.push(
      `(${blockName}: ${blockLabel} { parameters: '${blockParameters}', heads: '${heads}', active_heads: '${activeHeads}', family: '${family}', block_index: '${blockIndex}' })`
    );
    lines.push(
      `(${headRotation}: RotationScheduler { schedule: 'wallington_rotation', stages: '${stages}', chunks: '${chunks}', role: 'inner-head-rotation' })`
    );
    lines.push(
      `(${headRouter}: HeadRouter { heads: '${heads}', active_heads: '${activeHeads}', block: '${blockName}' })`
    );
    for (const [headIndex, headName] of headNames.entries()) {
      lines.push(
        `(${headName}: ${headLabel} { parameters: '${headParameters}', head: '${headIndex}', block: '${blockName}' })`
      );
    }
    lines.push(
      `(${headWhip}: FoldOperator { role: 'worthington-whip', boundary: 'head-whip', strategy: '${innerFoldStrategy}' })`
    );
    lines.push(`(${blockOut}: FlowFrame { role: 'transformerlet-out' })`);
    lines.push(`(${blockName})-[:PROCESS]->(${headRotation})`);
    lines.push(
      `(${headRotation})-[:FORK { schedule: 'wallington_rotation' }]->(${headRouter})`
    );
    lines.push(`(${headRouter})-[:FORK]->(${headNames.join(' | ')})`);
    lines.push(
      `(${headNames.join(
        ' | '
      )})-[:FOLD { strategy: '${innerFoldStrategy}', boundary: 'head-whip' }]->(${headWhip})`
    );
    lines.push(`(${headWhip})-[:PROCESS]->(${blockOut})`);
  }

  lines.push(
    `(${blockOutputs.join(
      ' | '
    )})-[:FOLD { strategy: '${outerFoldStrategy}', boundary: 'outer-whip' }]->(${
      primitive.id
    })`
  );
  return lines;
}

export function expandStructuredPrimitivesSource(source: string): string {
  const lines = source.split('\n');
  const primitives = lines
    .map((line) => parseStructuredMoaPrimitive(line))
    .filter(
      (primitive): primitive is StructuredMoaPrimitive => primitive !== null
    );

  if (primitives.length === 0) {
    return source;
  }

  const primitiveIds = new Set(primitives.map((primitive) => primitive.id));
  return lines
    .flatMap((line) => {
      const primitive = parseStructuredMoaPrimitive(line);
      if (primitive) {
        return expandStructuredMoaPrimitive(primitive);
      }

      return [rewriteIncomingPrimitiveTargets(line, primitiveIds)];
    })
    .join('\n');
}
