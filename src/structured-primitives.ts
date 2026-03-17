type StructuredPrimitiveKind =
  | 'StructuredMoA'
  | 'WallingtonRotation'
  | 'WorthingtonWhip';

interface StructuredPrimitive {
  readonly id: string;
  readonly kind: StructuredPrimitiveKind;
  readonly properties: Record<string, string>;
}

const STRUCTURED_PRIMITIVE_PATTERN =
  /^\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(StructuredMoA|WallingtonRotation|WorthingtonWhip)\s*(?:{([^}]*)})?\s*\)\s*$/;
const EDGE_PATTERN =
  /^\(([^)]+)\)\s*-\[:([A-Z]+)(?:\s*{([^}]*)})?\]->\s*\(([^)]+)\)\s*$/;
const ARRAY_LITERAL_PATTERN = /^\[(.*)\]$/;
const MAX_STRUCTURED_PRIMITIVE_PASSES = 8;

function parseProperties(propertiesRaw?: string): Record<string, string> {
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

function resolveNameList(
  rawValue: string | undefined,
  count: number,
  fallbackName: (index: number) => string
): readonly string[] {
  const names = parseNameList(rawValue);
  if (names.length === count) {
    return names;
  }

  return Array.from({ length: count }, (_, index) => fallbackName(index));
}

function parseStructuredPrimitive(line: string): StructuredPrimitive | null {
  const match = line.match(STRUCTURED_PRIMITIVE_PATTERN);
  if (!match) {
    return null;
  }

  const id = match[1]?.trim();
  const kind = match[2]?.trim() as StructuredPrimitiveKind | undefined;
  if (!id || !kind) {
    return null;
  }

  return {
    id,
    kind,
    properties: parseProperties(match[3]?.trim()),
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

function renderNode(
  id: string,
  label: string,
  properties: Readonly<Record<string, string>>
): string {
  return `(${id}: ${label}${renderPrimitiveProperties(properties)})`;
}

function expandStructuredMoaPrimitive(
  primitive: StructuredPrimitive
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
  const blockNames = resolveNameList(
    primitive.properties.blockNames,
    blocks,
    (index) => `${primitive.id}__block_${index}`
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
  lines.push(`(${primitive.id}__router)-[:FORK]->(${blockNames.join(' | ')})`);

  const blockOutputs: string[] = [];
  for (const [blockIndex, blockName] of blockNames.entries()) {
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

function expandWallingtonRotationPrimitive(
  primitive: StructuredPrimitive
): readonly string[] {
  const stages = parsePositiveInt(primitive.properties.stages, 4);
  const chunks = parsePositiveInt(primitive.properties.chunks, stages);
  const chunkLabel = primitive.properties.chunkLabel ?? 'EncoderChunk';
  const stageLabel = primitive.properties.stageLabel ?? 'EncoderShard';
  const outputLabel = primitive.properties.outputLabel ?? 'FlowFrame';
  const alignmentLabel = primitive.properties.alignmentLabel ?? 'FlowFrame';
  const schedule = primitive.properties.schedule ?? 'wallington_rotation';
  const foldStrategy = primitive.properties.foldStrategy ?? 'chunk-order';
  const ingressRole =
    primitive.properties.ingressRole ?? 'wallington-rotation-ingress';
  const alignmentRole =
    primitive.properties.alignmentRole ?? 'stage-aligned-chunks';
  const outputRole = primitive.properties.outputRole ?? 'rotated-output';
  const rotationRole =
    primitive.properties.rotationRole ?? 'wallington-rotation';
  const stageParameters = String(
    parsePositiveInt(
      primitive.properties.stageParameters ?? primitive.properties.parameters,
      1
    )
  );
  const chunkNames = resolveNameList(
    primitive.properties.chunkNames,
    chunks,
    (index) => `${primitive.id}__chunk_${index}`
  );
  const stageNames = resolveNameList(
    primitive.properties.stageNames,
    stages,
    (index) => `${primitive.id}__stage_${index}`
  );

  const lines: string[] = [];
  lines.push(
    `// WallingtonRotation '${primitive.id}' expanded into chunked stage-pipeline topology.`
  );
  lines.push(
    renderNode(`${primitive.id}__ingress`, 'FlowFrame', {
      role: ingressRole,
      primitive: 'WallingtonRotation',
    })
  );
  lines.push(
    renderNode(`${primitive.id}__scheduler`, 'RotationScheduler', {
      schedule,
      stages: String(stages),
      chunks: String(chunks),
      role: rotationRole,
    })
  );
  for (const [chunkIndex, chunkName] of chunkNames.entries()) {
    lines.push(
      renderNode(chunkName, chunkLabel, {
        ordinal: String(chunkIndex),
      })
    );
  }
  lines.push(
    renderNode(`${primitive.id}__stage_aligned`, alignmentLabel, {
      role: alignmentRole,
      primitive: 'WallingtonRotation',
    })
  );
  for (const [stageIndex, stageName] of stageNames.entries()) {
    lines.push(
      renderNode(stageName, stageLabel, {
        stage: stageName,
        parameters: stageParameters,
        stage_index: String(stageIndex),
      })
    );
  }
  lines.push(
    renderNode(primitive.id, outputLabel, {
      primitive: 'WallingtonRotation',
      schedule,
      stages: String(stages),
      chunks: String(chunks),
      role: outputRole,
    })
  );
  lines.push(
    `(${primitive.id}__ingress)-[:PROCESS]->(${primitive.id}__scheduler)`
  );
  lines.push(
    `(${primitive.id}__scheduler)-[:FORK { schedule: '${schedule}' }]->(${chunkNames.join(
      ' | '
    )})`
  );
  lines.push(
    `(${chunkNames.join(
      ' | '
    )})-[:FOLD { strategy: '${foldStrategy}' }]->(${primitive.id}__stage_aligned)`
  );
  lines.push(
    `(${primitive.id}__stage_aligned)-[:PROCESS]->(${stageNames[0]})`
  );
  for (let stageIndex = 0; stageIndex < stageNames.length - 1; stageIndex++) {
    lines.push(
      `(${stageNames[stageIndex]})-[:PROCESS]->(${stageNames[stageIndex + 1]})`
    );
  }
  lines.push(
    `(${stageNames[stageNames.length - 1]})-[:PROCESS]->(${primitive.id})`
  );

  return lines;
}

function expandWorthingtonWhipPrimitive(
  primitive: StructuredPrimitive
): readonly string[] {
  const shardCount = parsePositiveInt(
    primitive.properties.shardCount ?? primitive.properties.shards,
    2
  );
  const activeShards = Math.min(
    shardCount,
    parsePositiveInt(
      primitive.properties.activeShards ??
        primitive.properties.activePaths ??
        primitive.properties.active_paths,
      shardCount
    )
  );
  const stages = parsePositiveInt(primitive.properties.stages, 2);
  const chunks = parsePositiveInt(primitive.properties.chunks, stages);
  const shardNames = resolveNameList(
    primitive.properties.shardNames,
    shardCount,
    (index) => `${primitive.id}__shard_${index}`
  );
  const stageNameBases = parseNameList(primitive.properties.stageNames);
  const chunkLabel = primitive.properties.chunkLabel ?? 'EncoderChunk';
  const stageLabel = primitive.properties.stageLabel ?? 'EncoderShard';
  const schedule = primitive.properties.schedule ?? 'wallington_rotation';
  const outputLabel = primitive.properties.outputLabel ?? 'FlowFrame';
  const outputRole = primitive.properties.outputRole ?? 'collapsed-output';
  const ingressRole =
    primitive.properties.ingressRole ?? 'worthington-whip-ingress';
  const routerRole =
    primitive.properties.routerRole ?? 'worthington-whip-router';
  const collapseRole =
    primitive.properties.collapseRole ?? 'worthington-whip';
  const collapseBoundary =
    primitive.properties.collapseBoundary ?? 'shards';
  const collapseStrategy =
    primitive.properties.collapseStrategy ?? 'worthington_whip';
  const stageParameters = String(
    parsePositiveInt(
      primitive.properties.stageParameters ?? primitive.properties.parameters,
      1
    )
  );

  const lines: string[] = [];
  lines.push(
    `// WorthingtonWhip '${primitive.id}' expanded into routed shard-local Wallington rotations plus one collapse boundary.`
  );
  lines.push(
    renderNode(`${primitive.id}__ingress`, 'FlowFrame', {
      role: ingressRole,
      primitive: 'WorthingtonWhip',
    })
  );
  lines.push(
    renderNode(`${primitive.id}__router`, 'RoutingGate', {
      transformerlets: String(shardCount),
      active_paths: String(activeShards),
      role: routerRole,
    })
  );
  lines.push(
    renderNode(`${primitive.id}__collapse`, 'FoldOperator', {
      role: collapseRole,
      boundary: collapseBoundary,
      strategy: collapseStrategy,
    })
  );
  lines.push(
    renderNode(primitive.id, outputLabel, {
      primitive: 'WorthingtonWhip',
      shards: String(shardCount),
      active_shards: String(activeShards),
      role: outputRole,
    })
  );
  lines.push(
    `(${primitive.id}__ingress)-[:PROCESS]->(${primitive.id}__router)`
  );
  lines.push(
    `(${primitive.id}__router)-[:FORK]->(${shardNames.join(' | ')})`
  );

  const shardRotationNames: string[] = [];
  for (const [shardIndex, shardName] of shardNames.entries()) {
    const rotationName = `${shardName}__rotation`;
    const stageNames =
      stageNameBases.length === stages
        ? stageNameBases.map((stageName) => `${shardName}__${stageName}`)
        : Array.from(
            { length: stages },
            (_, stageOffset) => `${shardName}__stage_${stageOffset}`
          );
    shardRotationNames.push(rotationName);

    lines.push(
      renderNode(shardName, 'FlowFrame', {
        role: 'worthington-shard',
        shard: String(shardIndex),
      })
    );
    lines.push(
      `(${rotationName}: WallingtonRotation { stages: '${stages}', chunks: '${chunks}', schedule: '${schedule}', chunkLabel: '${chunkLabel}', stageLabel: '${stageLabel}', stageParameters: '${stageParameters}', stageNames: '[${stageNames.join(
        ','
      )}]', outputLabel: 'FlowFrame', outputRole: 'worthington-shard-output', ingressRole: 'worthington-shard-ingress', alignmentRole: 'worthington-shard-aligned', rotationRole: 'worthington-shard-rotation' })`
    );
    lines.push(`(${shardName})-[:PROCESS]->(${rotationName})`);
  }

  lines.push(
    `(${shardRotationNames.join(
      ' | '
    )})-[:FOLD { strategy: '${collapseStrategy}', boundary: '${collapseBoundary}' }]->(${primitive.id}__collapse)`
  );
  lines.push(`(${primitive.id}__collapse)-[:PROCESS]->(${primitive.id})`);

  return lines;
}

function expandStructuredPrimitive(
  primitive: StructuredPrimitive
): readonly string[] {
  switch (primitive.kind) {
    case 'StructuredMoA':
      return expandStructuredMoaPrimitive(primitive);
    case 'WallingtonRotation':
      return expandWallingtonRotationPrimitive(primitive);
    case 'WorthingtonWhip':
      return expandWorthingtonWhipPrimitive(primitive);
  }
}

export function expandStructuredPrimitivesSource(source: string): string {
  let expandedSource = source;

  for (
    let passIndex = 0;
    passIndex < MAX_STRUCTURED_PRIMITIVE_PASSES;
    passIndex++
  ) {
    const lines = expandedSource.split('\n');
    const primitives = lines
      .map((line) => parseStructuredPrimitive(line))
      .filter(
        (primitive): primitive is StructuredPrimitive => primitive !== null
      );

    if (primitives.length === 0) {
      return expandedSource;
    }

    const primitiveIds = new Set(primitives.map((primitive) => primitive.id));
    expandedSource = lines
      .flatMap((line) => {
        const primitive = parseStructuredPrimitive(line);
        if (primitive) {
          return expandStructuredPrimitive(primitive);
        }

        return [rewriteIncomingPrimitiveTargets(line, primitiveIds)];
      })
      .join('\n');
  }

  throw new Error(
    `Structured primitive expansion exceeded ${MAX_STRUCTURED_PRIMITIVE_PASSES} passes.`
  );
}
