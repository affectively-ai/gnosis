import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeGnosisSource,
  type GnosisComplexityReport,
} from './analysis.js';
import { BettyCompiler, type Diagnostic } from './betty/compiler.js';
import { GnosisEngine } from './runtime/engine.js';
import { GnosisRegistry } from './runtime/registry.js';
import {
  generateTlaFromGnosisSource,
  type GnosisTlaBridgeStats,
} from './tla-bridge.js';

export interface BehavioralLoopLogic {
  given: string;
  when: string;
  then: string;
  result: string;
}

export interface BehavioralLoopTaxonomy {
  origin: string;
  modality: string;
  mutability: number | string;
  valences: string[];
}

export interface BehavioralLoopOperator {
  name: string;
  mechanism: string;
}

export interface BehavioralLoopIntervention {
  difficulty?: number;
  interdict?: string;
  leverage?: string;
  minimize?: string;
  recognize?: string;
}

export interface BehavioralLoopMeta {
  tags: string[];
  relatedArchetypes?: string[];
  academicFields?: string[];
}

export interface BehavioralLoopRecord {
  id: number;
  name: string;
  logic: BehavioralLoopLogic;
  taxonomy: BehavioralLoopTaxonomy;
  operator: BehavioralLoopOperator;
  intervention?: BehavioralLoopIntervention;
  meta: BehavioralLoopMeta;
}

export interface BehavioralLoopCategoryRecord {
  id: string;
  categoryNumber: number;
  name: string;
  description?: string;
  loops: BehavioralLoopRecord[];
}

export interface BehavioralLoopsDataset {
  metadata?: {
    title?: string;
    version?: string;
    totalCategories?: number;
    totalLoops?: number;
  };
  categories: BehavioralLoopCategoryRecord[];
}

export interface BehavioralTaxonomySelectionOptions {
  categoryIds?: string[];
  loopIds?: number[];
}

export interface BehavioralTaxonomySelection {
  categories: BehavioralLoopCategoryRecord[];
  loops: BehavioralLoopRecord[];
}

export interface BehavioralTaxonomyMeasureOptions
  extends BehavioralTaxonomySelectionOptions {
  sourcePath?: string;
  writeTopologyPath?: string;
}

export interface BehavioralTaxonomyMeasurement {
  datasetPath: string;
  selectedCategoryCount: number;
  selectedLoopCount: number;
  topologySource: string;
  report: GnosisComplexityReport;
}

export type BehavioralExecutionInterventionKind =
  | 'recognize'
  | 'interdict'
  | 'minimize'
  | 'leverage';

export interface BehavioralExecutionContext {
  givenSatisfied?: boolean;
  whenSatisfied?: boolean;
  signalState?: string;
  eventState?: string;
  interventions?: BehavioralExecutionInterventionKind[];
  evidence?: string[];
  intensity?: number;
  observer?: string;
  subject?: string;
}

export type BehavioralExecutionStatus = 'inactive' | 'triggered';

export type BehavioralExecutionMode =
  | 'unmodulated'
  | 'regulated'
  | 'amplified'
  | 'mixed';

export interface BehavioralExecutionPayload {
  status: BehavioralExecutionStatus;
  loopId: number;
  loopName: string;
  summary: string;
  reason?: string;
  mode?: BehavioralExecutionMode;
  activatedInterventions?: BehavioralExecutionInterventionKind[];
  context?: BehavioralExecutionContext;
  response?: string;
  result?: string;
  operator?: {
    name: string;
    mechanism: string;
  };
  taxonomy?: BehavioralLoopTaxonomy;
}

export interface BehavioralLoopExecution {
  topologySource: string;
  logs: string;
  payload: BehavioralExecutionPayload;
}

export interface BehavioralLoopArtifactWriteOptions
  extends BehavioralTaxonomySelectionOptions {
  sourcePath?: string;
  outputDirectory: string;
}

export interface BehavioralLoopArtifactManifestEntry {
  categoryId: string;
  categoryName: string;
  loopId: number;
  loopName: string;
  topologyFile: string;
  tlaFile: string;
  cfgFile: string;
  tlaModuleName: string;
  buleyNumber: number;
  wallaceNumber: number;
  quantumIndex: number;
  topology: {
    nodeCount: number;
    edgeCount: number;
    structuralBeta1: number;
    forkEdgeCount: number;
    foldEdgeCount: number;
    interfereEdgeCount: number;
    maxBranchFactor: number;
  };
  tlaStats: GnosisTlaBridgeStats;
}

export interface BehavioralLoopArtifactManifest {
  datasetPath: string;
  outputDirectory: string;
  generatedAt: string;
  selectedCategoryCount: number;
  selectedLoopCount: number;
  entries: BehavioralLoopArtifactManifestEntry[];
}

interface LoopDependency {
  sourceLoopId: number;
  targetLoopId: number;
  type: 'prerequisite' | 'enhances';
}

type GnosisPropertyValue = string | number | boolean;

interface BehaviorRuntimeLoopDescriptor {
  id: number;
  name: string;
  logic: BehavioralLoopLogic;
  taxonomy: BehavioralLoopTaxonomy;
  operator: BehavioralLoopOperator;
  intervention: Partial<
    Record<
      BehavioralExecutionInterventionKind,
      {
        text: string;
        difficulty?: number;
      }
    >
  >;
}

const BEHAVIOR_INTERVENTION_KINDS = [
  'recognize',
  'interdict',
  'minimize',
  'leverage',
] as const satisfies readonly BehavioralExecutionInterventionKind[];

const DEFAULT_DATASET_URL_CANDIDATES = [
  new URL('../../behavioral-taxonomy/data/behavioralLoops.json', import.meta.url),
  new URL('../../../docs/data-archives/behavioralLoops.json', import.meta.url),
] as const;

const VALENCE_PREREQUISITES: Record<string, string[]> = {
  DOMINANCE: ['TRUST'],
  ATTRACTION: ['TRUST'],
  DECEPTION: [],
};

function resolveDefaultDatasetPath(): string {
  for (const candidateUrl of DEFAULT_DATASET_URL_CANDIDATES) {
    const candidatePath = fileURLToPath(candidateUrl);
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error(
    'Unable to locate a behavioral loops dataset. Checked the open-source package and docs archive.'
  );
}

function sanitizeNodeId(raw: string): string {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized.length > 0 ? normalized : 'node';
}

function sanitizeFileSlug(raw: string): string {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return normalized.length > 0 ? normalized : 'behavior';
}

function getLoopNodeId(loopId: number, suffix: string): string {
  return sanitizeNodeId(`loop_${loopId}_${suffix}`);
}

function getBehavioralLoopArtifactBaseName(
  category: BehavioralLoopCategoryRecord,
  loop: BehavioralLoopRecord,
  disambiguate: boolean
): string {
  const prefix = disambiguate ? `${sanitizeFileSlug(category.id)}-` : '';
  return `${prefix}loop-${loop.id}-${sanitizeFileSlug(loop.name)}`;
}

function getBehavioralLoopTlaModuleName(
  category: BehavioralLoopCategoryRecord,
  loop: BehavioralLoopRecord,
  disambiguate: boolean
): string {
  const prefix = disambiguate ? `${sanitizeNodeId(category.id)}_` : '';
  return `BehaviorLoop_${prefix}${loop.id}_${sanitizeNodeId(loop.name)}`;
}

function renderNode(nodeId: string, label: string): string {
  return `(${nodeId}: ${label})`;
}

function renderPropertyValue(value: GnosisPropertyValue): string {
  if (typeof value !== 'string') {
    return JSON.stringify(value);
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized.includes("'")) {
    return `'${normalized}'`;
  }

  if (!normalized.includes('"')) {
    return `"${normalized}"`;
  }

  return `'${normalized.replace(/'/g, '’')}'`;
}

function encodeBehaviorText(value: string | undefined): string | undefined {
  return value ? encodeURIComponent(value) : undefined;
}

function decodeBehaviorText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function renderNodeWithProperties(
  nodeId: string,
  label: string,
  properties: Record<string, GnosisPropertyValue | undefined> = {}
): string {
  const entries = Object.entries(properties).flatMap(([key, value]) =>
    value === undefined ? [] : ([[key, value]] as const)
  );
  if (entries.length === 0) {
    return renderNode(nodeId, label);
  }

  const propertyExpr = entries
    .map(([key, value]) => `${key}: ${renderPropertyValue(value)}`)
    .join(', ');

  return `(${nodeId}: ${label} { ${propertyExpr} })`;
}

function renderEdge(
  sources: string[],
  edgeType: 'PROCESS' | 'FORK' | 'FOLD' | 'INTERFERE',
  targets: string[],
  properties?: string
): string {
  const sourceExpr = `(${sources.join(' | ')})`;
  const targetExpr = `(${targets.join(' | ')})`;
  const propertyExpr = properties ? ` { ${properties} }` : '';
  return `${sourceExpr}-[:${edgeType}${propertyExpr}]->${targetExpr}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseDelimitedValues(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(/[\s,|]+/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function parseOptionalNumber(raw: string | undefined): number | undefined {
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBehavioralExecutionContext(
  payload: unknown
): BehavioralExecutionContext {
  if (!isRecord(payload)) {
    return {};
  }

  const interventions = Array.isArray(payload.interventions)
    ? payload.interventions
        .filter(
          (value): value is BehavioralExecutionInterventionKind =>
            typeof value === 'string' &&
            BEHAVIOR_INTERVENTION_KINDS.includes(
              value as BehavioralExecutionInterventionKind
            )
        )
    : [];

  const evidence = Array.isArray(payload.evidence)
    ? payload.evidence.filter((value): value is string => typeof value === 'string')
    : undefined;

  return {
    givenSatisfied:
      typeof payload.givenSatisfied === 'boolean'
        ? payload.givenSatisfied
        : undefined,
    whenSatisfied:
      typeof payload.whenSatisfied === 'boolean' ? payload.whenSatisfied : undefined,
    signalState:
      typeof payload.signalState === 'string' ? payload.signalState : undefined,
    eventState: typeof payload.eventState === 'string' ? payload.eventState : undefined,
    interventions,
    evidence,
    intensity:
      typeof payload.intensity === 'number' ? payload.intensity : undefined,
    observer: typeof payload.observer === 'string' ? payload.observer : undefined,
    subject: typeof payload.subject === 'string' ? payload.subject : undefined,
  };
}

function resolveStageSatisfied(
  context: BehavioralExecutionContext,
  stage: 'given' | 'when'
): boolean {
  const explicitFlag =
    stage === 'given' ? context.givenSatisfied : context.whenSatisfied;
  if (typeof explicitFlag === 'boolean') {
    return explicitFlag;
  }

  const stateValue = stage === 'given' ? context.signalState : context.eventState;
  if (!stateValue) {
    return false;
  }

  const normalized = stateValue.trim().toLowerCase();
  if (['present', 'active', 'matched', 'true', 'yes'].includes(normalized)) {
    return true;
  }

  if (['absent', 'inactive', 'missing', 'false', 'no'].includes(normalized)) {
    return false;
  }

  return false;
}

function parseBehaviorRuntimeLoopDescriptor(
  props: Record<string, string>
): BehaviorRuntimeLoopDescriptor {
  const intervention: BehaviorRuntimeLoopDescriptor['intervention'] = {};

  for (const kind of BEHAVIOR_INTERVENTION_KINDS) {
    const text = props[`intervention_${kind}`];
    if (!text) {
      continue;
    }

    intervention[kind] = {
      text: decodeBehaviorText(text) ?? text,
      difficulty: parseOptionalNumber(props.interventionDifficulty),
    };
  }

  return {
    id: Number.parseInt(props.loopId ?? '0', 10),
    name: decodeBehaviorText(props.loopName) ?? 'Unnamed Loop',
    logic: {
      given: decodeBehaviorText(props.given) ?? '',
      when: decodeBehaviorText(props.when) ?? '',
      then: decodeBehaviorText(props.then) ?? '',
      result: decodeBehaviorText(props.result) ?? '',
    },
    taxonomy: {
      origin: props.origin ?? '',
      modality: props.modality ?? '',
      mutability: props.mutability ?? '',
      valences: parseDelimitedValues(props.valences),
    },
    operator: {
      name: decodeBehaviorText(props.operatorName) ?? '',
      mechanism: decodeBehaviorText(props.operatorMechanism) ?? '',
    },
    intervention,
  };
}

function getTaggedErrorPayload(payload: unknown): Record<string, unknown> | undefined {
  if (!isRecord(payload) || payload.kind !== 'err' || !isRecord(payload.error)) {
    return undefined;
  }

  return payload.error;
}

function getTaggedValuePayload(payload: unknown): Record<string, unknown> | undefined {
  if (
    !isRecord(payload) ||
    (payload.kind !== 'ok' && payload.kind !== 'some') ||
    !isRecord(payload.value)
  ) {
    return undefined;
  }

  return payload.value;
}

function collectFoldBranchRecords(payload: unknown): Record<string, unknown>[] {
  if (!isRecord(payload)) {
    return [];
  }

  return Object.values(payload).filter(isRecord);
}

function getFirstBranchRecord(
  branches: Record<string, unknown>[],
  key: string
): Record<string, unknown> | undefined {
  return branches.find(
    (branch) => key in branch && isRecord(branch[key])
  )?.[key] as Record<string, unknown> | undefined;
}

function getStringProperty(
  record: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  const value = record?.[key];
  return typeof value === 'string' ? value : undefined;
}

function getBehavioralExecutionMode(
  activatedInterventions: BehavioralExecutionInterventionKind[]
): BehavioralExecutionMode {
  const hasDestructive = activatedInterventions.some((kind) =>
    ['recognize', 'interdict', 'minimize'].includes(kind)
  );
  const hasLeverage = activatedInterventions.includes('leverage');

  if (hasDestructive && hasLeverage) {
    return 'mixed';
  }

  if (hasDestructive) {
    return 'regulated';
  }

  if (hasLeverage) {
    return 'amplified';
  }

  return 'unmodulated';
}

function formatBehaviorParseDiagnostics(diagnostics: Diagnostic[]): string {
  return diagnostics
    .map((diagnostic) => diagnostic.message)
    .join('; ');
}

function isBehavioralExecutionPayload(
  payload: unknown
): payload is BehavioralExecutionPayload {
  return (
    isRecord(payload) &&
    (payload.status === 'inactive' || payload.status === 'triggered') &&
    typeof payload.loopId === 'number' &&
    typeof payload.loopName === 'string' &&
    typeof payload.summary === 'string'
  );
}

function inferDependencies(loops: BehavioralLoopRecord[]): LoopDependency[] {
  const dependencies: LoopDependency[] = [];
  const seen = new Set<string>();

  for (const loop of loops) {
    for (const valence of loop.taxonomy.valences) {
      const prerequisiteValences = VALENCE_PREREQUISITES[valence] ?? [];
      for (const prerequisiteValence of prerequisiteValences) {
        const prerequisiteLoops = loops.filter(
          (candidate) =>
            candidate.id !== loop.id &&
            candidate.taxonomy.valences.includes(prerequisiteValence)
        );

        for (const prerequisiteLoop of prerequisiteLoops.slice(0, 3)) {
          const key = `${prerequisiteLoop.id}->${loop.id}:prerequisite`;
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          dependencies.push({
            sourceLoopId: prerequisiteLoop.id,
            targetLoopId: loop.id,
            type: 'prerequisite',
          });
        }
      }
    }

    const sameOriginLoops = loops.filter(
      (candidate) =>
        candidate.id !== loop.id &&
        candidate.taxonomy.origin === loop.taxonomy.origin
    );

    for (const relatedLoop of sameOriginLoops.slice(0, 2)) {
      const key = `${relatedLoop.id}->${loop.id}:enhances`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      dependencies.push({
        sourceLoopId: relatedLoop.id,
        targetLoopId: loop.id,
        type: 'enhances',
      });
    }
  }

  return dependencies;
}

export function loadBehavioralLoopsDataset(
  sourcePath?: string
): { dataset: BehavioralLoopsDataset; datasetPath: string } {
  const datasetPath = sourcePath
    ? path.resolve(process.cwd(), sourcePath)
    : resolveDefaultDatasetPath();
  const raw = readFileSync(datasetPath, 'utf8');
  const dataset = JSON.parse(raw) as BehavioralLoopsDataset;

  if (!Array.isArray(dataset.categories) || dataset.categories.length === 0) {
    throw new Error(`Dataset at ${datasetPath} does not contain any categories.`);
  }

  return { dataset, datasetPath };
}

export function selectBehavioralTaxonomy(
  dataset: BehavioralLoopsDataset,
  options: BehavioralTaxonomySelectionOptions = {}
): BehavioralTaxonomySelection {
  const requestedCategories = new Set(options.categoryIds ?? []);
  const requestedLoopIds = new Set(options.loopIds ?? []);
  const filterCategories = requestedCategories.size > 0;
  const filterLoops = requestedLoopIds.size > 0;

  const categories = dataset.categories
    .filter((category) => !filterCategories || requestedCategories.has(category.id))
    .map((category) => ({
      ...category,
      loops: category.loops.filter(
        (loop) => !filterLoops || requestedLoopIds.has(loop.id)
      ),
    }))
    .filter((category) => category.loops.length > 0);

  const loops = categories.flatMap((category) => category.loops);

  if (loops.length === 0) {
    throw new Error(
      'No behavioral loops matched the requested category or loop filters.'
    );
  }

  return {
    categories,
    loops,
  };
}

export function buildBehavioralTaxonomyTopology(
  selection: BehavioralTaxonomySelection
): string {
  const nodeLines = new Set<string>();
  const edgeLines: string[] = [];
  const categorySummaryIds: string[] = [];
  const dependencies = inferDependencies(selection.loops);
  const selectedLoopIds = new Set(selection.loops.map((loop) => loop.id));

  for (const category of selection.categories) {
    const categoryNodeId = sanitizeNodeId(`category_${category.id}`);
    const categorySummaryNodeId = sanitizeNodeId(
      `category_${category.id}_summary`
    );
    const loopIds = category.loops.map((loop) => sanitizeNodeId(`loop_${loop.id}`));
    const resultIds = category.loops.map((loop) => getLoopNodeId(loop.id, 'result'));

    nodeLines.add(renderNode(categoryNodeId, 'Category'));
    nodeLines.add(renderNode(categorySummaryNodeId, 'CategorySummary'));
    categorySummaryIds.push(categorySummaryNodeId);

    if (loopIds.length === 1) {
      edgeLines.push(renderEdge([categoryNodeId], 'PROCESS', loopIds));
    } else {
      edgeLines.push(
        renderEdge(
          [categoryNodeId],
          'FORK',
          loopIds,
          `strategy: ${JSON.stringify('category-branch')}`
        )
      );
    }

    if (resultIds.length === 1) {
      edgeLines.push(renderEdge(resultIds, 'PROCESS', [categorySummaryNodeId]));
    } else {
      edgeLines.push(
        renderEdge(
          resultIds,
          'FOLD',
          [categorySummaryNodeId],
          `strategy: ${JSON.stringify('category-aggregate')}`
        )
      );
    }

    for (const loop of category.loops) {
      const loopNodeId = sanitizeNodeId(`loop_${loop.id}`);
      const givenNodeId = getLoopNodeId(loop.id, 'given');
      const whenNodeId = getLoopNodeId(loop.id, 'when');
      const thenNodeId = getLoopNodeId(loop.id, 'then');
      const operatorNodeId = getLoopNodeId(loop.id, 'operator');
      const originNodeId = getLoopNodeId(loop.id, 'origin');
      const modalityNodeId = getLoopNodeId(loop.id, 'modality');
      const mutabilityNodeId = getLoopNodeId(loop.id, 'mutability');
      const resultNodeId = getLoopNodeId(loop.id, 'result');
      const valenceNodeIds = loop.taxonomy.valences.map((valence, index) =>
        getLoopNodeId(loop.id, `valence_${index}_${valence}`)
      );
      const interventionNodeIds = (
        [
          ['recognize', loop.intervention?.recognize],
          ['interdict', loop.intervention?.interdict],
          ['minimize', loop.intervention?.minimize],
          ['leverage', loop.intervention?.leverage],
        ] as const
      )
        .filter(([, value]) => Boolean(value))
        .map(([kind]) => getLoopNodeId(loop.id, `intervention_${kind}`));

      nodeLines.add(renderNode(loopNodeId, 'Loop'));
      nodeLines.add(renderNode(givenNodeId, 'Given'));
      nodeLines.add(renderNode(whenNodeId, 'When'));
      nodeLines.add(renderNode(thenNodeId, 'Then'));
      nodeLines.add(renderNode(operatorNodeId, 'Operator'));
      nodeLines.add(renderNode(originNodeId, 'Origin'));
      nodeLines.add(renderNode(modalityNodeId, 'Modality'));
      nodeLines.add(renderNode(mutabilityNodeId, 'Mutability'));
      nodeLines.add(renderNode(resultNodeId, 'Result'));

      for (const nodeId of valenceNodeIds) {
        nodeLines.add(renderNode(nodeId, 'Valence'));
      }
      for (const nodeId of interventionNodeIds) {
        nodeLines.add(renderNode(nodeId, 'Intervention'));
      }

      edgeLines.push(renderEdge([loopNodeId], 'PROCESS', [givenNodeId]));
      edgeLines.push(renderEdge([givenNodeId], 'PROCESS', [whenNodeId]));

      const branchTargets = [
        thenNodeId,
        operatorNodeId,
        originNodeId,
        modalityNodeId,
        mutabilityNodeId,
        ...valenceNodeIds,
        ...interventionNodeIds,
      ];

      if (branchTargets.length === 1) {
        edgeLines.push(renderEdge([whenNodeId], 'PROCESS', branchTargets));
      } else {
        edgeLines.push(
          renderEdge(
            [whenNodeId],
            'FORK',
            branchTargets,
            `strategy: ${JSON.stringify('loop-annotation')}`
          )
        );
      }

      if (branchTargets.length === 1) {
        edgeLines.push(renderEdge(branchTargets, 'PROCESS', [resultNodeId]));
      } else {
        edgeLines.push(
          renderEdge(
            branchTargets,
            'FOLD',
            [resultNodeId],
            `strategy: ${JSON.stringify('loop-resolution')}`
          )
        );
      }
    }
  }

  for (const dependency of dependencies) {
    if (
      !selectedLoopIds.has(dependency.sourceLoopId) ||
      !selectedLoopIds.has(dependency.targetLoopId)
    ) {
      continue;
    }

    const sourceNodeId = getLoopNodeId(dependency.sourceLoopId, 'result');
    const targetNodeId = getLoopNodeId(
      dependency.targetLoopId,
      dependency.type === 'prerequisite' ? 'given' : 'when'
    );
    const edgeType = dependency.type === 'prerequisite' ? 'PROCESS' : 'INTERFERE';
    const relation = JSON.stringify(dependency.type);
    edgeLines.push(
      renderEdge([sourceNodeId], edgeType, [targetNodeId], `relation: ${relation}`)
    );
  }

  const taxonomySummaryNodeId = 'behavioral_taxonomy_summary';
  nodeLines.add(renderNode(taxonomySummaryNodeId, 'TaxonomySummary'));
  if (categorySummaryIds.length === 1) {
    edgeLines.push(
      renderEdge(categorySummaryIds, 'PROCESS', [taxonomySummaryNodeId])
    );
  } else {
    edgeLines.push(
      renderEdge(
        categorySummaryIds,
        'FOLD',
        [taxonomySummaryNodeId],
        `strategy: ${JSON.stringify('taxonomy-aggregate')}`
      )
    );
  }

  const sections = [
    '// behavioral-taxonomy.gg',
    '// Generated from @affectively/behavioral-taxonomy for Gnosis buley-number measurement.',
    '// Mapping: category -> loop branches, per-loop logic expansion, inferred prerequisites, same-origin couplings.',
    '',
    '// Nodes',
    ...Array.from(nodeLines).sort(),
    '',
    '// Topology',
    ...edgeLines,
  ];

  return sections.join('\n');
}

export async function measureBehavioralTaxonomySelection(
  selection: BehavioralTaxonomySelection
): Promise<Pick<BehavioralTaxonomyMeasurement, 'topologySource' | 'report'>> {
  const topologySource = buildBehavioralTaxonomyTopology(selection);
  const report = await analyzeGnosisSource(topologySource);
  return {
    topologySource,
    report,
  };
}

export async function measureBehavioralTaxonomy(
  options: BehavioralTaxonomyMeasureOptions = {}
): Promise<BehavioralTaxonomyMeasurement> {
  const { dataset, datasetPath } = loadBehavioralLoopsDataset(options.sourcePath);
  const selection = selectBehavioralTaxonomy(dataset, options);
  const { topologySource, report } =
    await measureBehavioralTaxonomySelection(selection);

  if (options.writeTopologyPath) {
    const writePath = path.resolve(process.cwd(), options.writeTopologyPath);
    writeFileSync(writePath, topologySource);
  }

  return {
    datasetPath,
    selectedCategoryCount: selection.categories.length,
    selectedLoopCount: selection.loops.length,
    topologySource,
    report,
  };
}

export function formatBehavioralTaxonomyMeasurement(
  measurement: BehavioralTaxonomyMeasurement
): string {
  const { report } = measurement;
  return [
    `[behavioral-taxonomy] dataset=${measurement.datasetPath}`,
    `selection: categories=${measurement.selectedCategoryCount}, loops=${measurement.selectedLoopCount}`,
    `buley-number: ${report.buleyNumber}`,
    `topology: nodes=${report.topology.nodeCount}, edges=${report.topology.edgeCount}, beta1=${report.topology.structuralBeta1}`,
    `quantum: index=${report.quantum.quantumIndex}, collapse-deficit=${report.quantum.collapseDeficit}`,
    `steering: wally=${report.steering.wallaceNumber}, regime=${report.steering.regime}, action=${report.steering.recommendedAction ?? 'n/a'}`,
  ].join('\n');
}

function createBehavioralExecutionRegistry(): GnosisRegistry {
  const registry = new GnosisRegistry();

  registry.register('BehaviorStart', async (payload, props) => ({
    context: parseBehavioralExecutionContext(payload),
    loop: parseBehaviorRuntimeLoopDescriptor(props),
  }));

  registry.register('BehaviorAssess', async (payload, props) => {
    const stage = props.stage === 'when' ? 'when' : 'given';
    const source = getTaggedValuePayload(payload) ?? (isRecord(payload) ? payload : undefined);
    const context =
      source && isRecord(source.context)
        ? parseBehavioralExecutionContext(source.context)
        : {};
    const loop =
      source && isRecord(source.loop)
        ? (source.loop as unknown as BehaviorRuntimeLoopDescriptor)
        : parseBehaviorRuntimeLoopDescriptor(props);
    const satisfied = resolveStageSatisfied(context, stage);

    if (satisfied) {
      return {
        kind: 'ok',
        value: {
          context,
          loop,
          assessment: {
            stage,
            text: decodeBehaviorText(props.text) ?? '',
            satisfied: true,
          },
        },
      };
    }

    return {
      kind: 'err',
      error: {
        context,
        loop,
        assessment: {
          stage,
          text: decodeBehaviorText(props.text) ?? '',
          satisfied: false,
          reason: `${stage}-not-satisfied`,
        },
      },
    };
  });

  registry.register('BehaviorEmit', async (payload, props) => {
    const context = isRecord(payload) ? parseBehavioralExecutionContext(payload.context) : {};
    const emission = props.emission ?? 'unknown';

    switch (emission) {
      case 'context':
        return {
          contextSnapshot: context,
        };
      case 'then':
        return {
          response: {
            text: decodeBehaviorText(props.text) ?? '',
          },
        };
      case 'result':
        return {
          result: {
            text: decodeBehaviorText(props.text) ?? '',
          },
        };
      case 'operator':
        return {
          operator: {
            name: decodeBehaviorText(props.name) ?? '',
            mechanism: decodeBehaviorText(props.mechanism) ?? '',
          },
        };
      case 'taxonomy':
        return {
          taxonomy: {
            origin: props.origin ?? '',
            modality: props.modality ?? '',
            mutability: props.mutability ?? '',
            valences: parseDelimitedValues(props.valences),
          },
        };
      case 'intervention': {
        const interventionKind = props.interventionKind as
          | BehavioralExecutionInterventionKind
          | undefined;
        if (!interventionKind) {
          return {};
        }

        return {
          interventions: {
            [interventionKind]: {
              text: decodeBehaviorText(props.text) ?? '',
              active: context.interventions?.includes(interventionKind) ?? false,
            },
          },
        };
      }
      default:
        return {};
    }
  });

  registry.register('BehaviorVerdict', async (payload, props) => {
    const branches = collectFoldBranchRecords(payload);
    const contextRecord = getFirstBranchRecord(branches, 'contextSnapshot');
    const context =
      contextRecord !== undefined
        ? parseBehavioralExecutionContext(contextRecord)
        : undefined;
    const responseRecord = getFirstBranchRecord(branches, 'response');
    const resultRecord = getFirstBranchRecord(branches, 'result');
    const operatorRecord = getFirstBranchRecord(branches, 'operator');
    const taxonomyRecord = getFirstBranchRecord(branches, 'taxonomy');
    const activatedInterventions = branches.flatMap((branch) => {
      if (!('interventions' in branch) || !isRecord(branch.interventions)) {
        return [];
      }

      return Object.entries(branch.interventions)
        .filter(
          ([, intervention]) =>
            isRecord(intervention) && intervention.active === true
        )
        .map(([kind]) => kind as BehavioralExecutionInterventionKind);
    });
    const mode = getBehavioralExecutionMode(activatedInterventions);
    const loopName = decodeBehaviorText(props.loopName) ?? 'Unnamed Loop';
    const response =
      getStringProperty(responseRecord, 'text') ??
      decodeBehaviorText(props.then) ??
      '';
    const result =
      getStringProperty(resultRecord, 'text') ??
      decodeBehaviorText(props.result) ??
      '';
    const operator = {
      name:
        getStringProperty(operatorRecord, 'name') ??
        decodeBehaviorText(props.operatorName) ??
        '',
      mechanism:
        getStringProperty(operatorRecord, 'mechanism') ??
        decodeBehaviorText(props.operatorMechanism) ??
        '',
    };
    const taxonomy = {
      origin: getStringProperty(taxonomyRecord, 'origin') ?? props.origin ?? '',
      modality:
        getStringProperty(taxonomyRecord, 'modality') ?? props.modality ?? '',
      mutability:
        getStringProperty(taxonomyRecord, 'mutability') ??
        props.mutability ??
        '',
      valences:
        (Array.isArray(taxonomyRecord?.valences)
          ? taxonomyRecord.valences.filter(
              (value): value is string => typeof value === 'string'
            )
          : undefined) ?? parseDelimitedValues(props.valences),
    };

    return {
      status: 'triggered',
      loopId: Number.parseInt(props.loopId ?? '0', 10),
      loopName,
      mode,
      activatedInterventions,
      context,
      response,
      result,
      operator,
      taxonomy,
      summary:
        mode === 'unmodulated'
          ? `${loopName} triggered without intervention pressure: ${result}`
          : `${loopName} triggered in ${mode} mode: ${result}`,
    } satisfies BehavioralExecutionPayload;
  });

  registry.register('BehaviorTerminal', async (payload, props) => {
    const errorPayload = getTaggedErrorPayload(payload);
    const context =
      errorPayload && isRecord(errorPayload.context)
        ? parseBehavioralExecutionContext(errorPayload.context)
        : undefined;
    const reason =
      errorPayload && isRecord(errorPayload.assessment)
        ? getStringProperty(errorPayload.assessment, 'reason')
        : undefined;
    const loopRecord =
      errorPayload && isRecord(errorPayload.loop) ? errorPayload.loop : undefined;
    const loopName = getStringProperty(loopRecord, 'name') ?? props.loopName ?? '';
    const decodedLoopName = decodeBehaviorText(loopName) ?? loopName;
    const loopId = Number.parseInt(props.loopId ?? '0', 10);

    return {
      status: 'inactive',
      loopId,
      loopName: decodedLoopName,
      reason: reason ?? 'precondition-not-satisfied',
      context,
      summary: `${decodedLoopName} stayed inactive because ${reason ?? 'a precondition failed'}.`,
    } satisfies BehavioralExecutionPayload;
  });

  registry.register('BehaviorSink', async (payload) => payload);

  return registry;
}

export function buildBehavioralLoopExecutionTopology(
  loop: BehavioralLoopRecord
): string {
  const nodeLines = new Set<string>();
  const edgeLines: string[] = [];
  const loopBaseNodeId = sanitizeNodeId(`loop_${loop.id}`);
  const startNodeId = `${loopBaseNodeId}_start`;
  const givenGateNodeId = `${loopBaseNodeId}_given_gate`;
  const whenGateNodeId = `${loopBaseNodeId}_when_gate`;
  const contextNodeId = `${loopBaseNodeId}_context`;
  const inactiveNodeId = `${loopBaseNodeId}_inactive`;
  const sinkNodeId = `${loopBaseNodeId}_sink`;
  const contextBranchNodeId = `${loopBaseNodeId}_context_branch`;
  const thenBranchNodeId = `${loopBaseNodeId}_then_branch`;
  const operatorBranchNodeId = `${loopBaseNodeId}_operator_branch`;
  const resultBranchNodeId = `${loopBaseNodeId}_result_branch`;
  const taxonomyBranchNodeId = `${loopBaseNodeId}_taxonomy_branch`;
  const verdictNodeId = `${loopBaseNodeId}_verdict`;
  const interventionNodeIds = (
    [
      ['recognize', loop.intervention?.recognize],
      ['interdict', loop.intervention?.interdict],
      ['minimize', loop.intervention?.minimize],
      ['leverage', loop.intervention?.leverage],
    ] as const
  )
    .filter(([, text]) => Boolean(text))
    .map(([kind, text]) => ({
      kind,
      text: text ?? '',
      nodeId: `${loopBaseNodeId}_intervention_${kind}`,
    }));

  nodeLines.add(
    renderNodeWithProperties(startNodeId, 'BehaviorStart', {
      loopId: loop.id,
      loopName: encodeBehaviorText(loop.name),
      given: encodeBehaviorText(loop.logic.given),
      when: encodeBehaviorText(loop.logic.when),
      then: encodeBehaviorText(loop.logic.then),
      result: encodeBehaviorText(loop.logic.result),
      operatorName: encodeBehaviorText(loop.operator.name),
      operatorMechanism: encodeBehaviorText(loop.operator.mechanism),
      origin: loop.taxonomy.origin,
      modality: loop.taxonomy.modality,
      mutability: String(loop.taxonomy.mutability),
      valences: loop.taxonomy.valences.join('|'),
      interventionDifficulty:
        loop.intervention?.difficulty !== undefined
          ? String(loop.intervention.difficulty)
          : undefined,
      intervention_recognize: encodeBehaviorText(loop.intervention?.recognize),
      intervention_interdict: encodeBehaviorText(loop.intervention?.interdict),
      intervention_minimize: encodeBehaviorText(loop.intervention?.minimize),
      intervention_leverage: encodeBehaviorText(loop.intervention?.leverage),
    })
  );
  nodeLines.add(
    renderNodeWithProperties(givenGateNodeId, 'BehaviorAssess', {
      stage: 'given',
      text: encodeBehaviorText(loop.logic.given),
    })
  );
  nodeLines.add(
    renderNodeWithProperties(whenGateNodeId, 'BehaviorAssess', {
      stage: 'when',
      text: encodeBehaviorText(loop.logic.when),
    })
  );
  nodeLines.add(
    renderNodeWithProperties(contextNodeId, 'Destructure', {
      from: 'value',
      fields: 'context,loop',
    })
  );
  nodeLines.add(
    renderNodeWithProperties(inactiveNodeId, 'BehaviorTerminal', {
      loopId: loop.id,
      loopName: encodeBehaviorText(loop.name),
    })
  );
  nodeLines.add(
    renderNodeWithProperties(contextBranchNodeId, 'BehaviorEmit', {
      emission: 'context',
    })
  );
  nodeLines.add(
    renderNodeWithProperties(thenBranchNodeId, 'BehaviorEmit', {
      emission: 'then',
      text: encodeBehaviorText(loop.logic.then),
    })
  );
  nodeLines.add(
    renderNodeWithProperties(operatorBranchNodeId, 'BehaviorEmit', {
      emission: 'operator',
      name: encodeBehaviorText(loop.operator.name),
      mechanism: encodeBehaviorText(loop.operator.mechanism),
    })
  );
  nodeLines.add(
    renderNodeWithProperties(resultBranchNodeId, 'BehaviorEmit', {
      emission: 'result',
      text: encodeBehaviorText(loop.logic.result),
    })
  );
  nodeLines.add(
    renderNodeWithProperties(taxonomyBranchNodeId, 'BehaviorEmit', {
      emission: 'taxonomy',
      origin: loop.taxonomy.origin,
      modality: loop.taxonomy.modality,
      mutability: String(loop.taxonomy.mutability),
      valences: loop.taxonomy.valences.join('|'),
    })
  );
  for (const interventionNode of interventionNodeIds) {
    nodeLines.add(
      renderNodeWithProperties(interventionNode.nodeId, 'BehaviorEmit', {
        emission: 'intervention',
        interventionKind: interventionNode.kind,
        text: encodeBehaviorText(interventionNode.text),
      })
    );
  }
  nodeLines.add(
    renderNodeWithProperties(verdictNodeId, 'BehaviorVerdict', {
      loopId: loop.id,
      loopName: encodeBehaviorText(loop.name),
      then: encodeBehaviorText(loop.logic.then),
      result: encodeBehaviorText(loop.logic.result),
      operatorName: encodeBehaviorText(loop.operator.name),
      operatorMechanism: encodeBehaviorText(loop.operator.mechanism),
      origin: loop.taxonomy.origin,
      modality: loop.taxonomy.modality,
      mutability: String(loop.taxonomy.mutability),
      valences: loop.taxonomy.valences.join('|'),
    })
  );
  nodeLines.add(renderNode(sinkNodeId, 'BehaviorSink'));

  edgeLines.push(renderEdge([startNodeId], 'PROCESS', [givenGateNodeId]));
  edgeLines.push(
    renderEdge([givenGateNodeId], 'PROCESS', [whenGateNodeId], `case: ${JSON.stringify('ok')}`)
  );
  edgeLines.push(
    renderEdge([givenGateNodeId], 'PROCESS', [inactiveNodeId], `case: ${JSON.stringify('err')}`)
  );
  edgeLines.push(
    renderEdge([whenGateNodeId], 'PROCESS', [contextNodeId], `case: ${JSON.stringify('ok')}`)
  );
  edgeLines.push(
    renderEdge([whenGateNodeId], 'PROCESS', [inactiveNodeId], `case: ${JSON.stringify('err')}`)
  );

  const branchTargets = [
    contextBranchNodeId,
    thenBranchNodeId,
    operatorBranchNodeId,
    resultBranchNodeId,
    taxonomyBranchNodeId,
    ...interventionNodeIds.map((interventionNode) => interventionNode.nodeId),
  ];
  edgeLines.push(
    renderEdge(
      [contextNodeId],
      'FORK',
      branchTargets,
      `strategy: ${JSON.stringify('behavior-branches')}`
    )
  );
  edgeLines.push(
    renderEdge(
      branchTargets,
      'FOLD',
      [verdictNodeId],
      `strategy: ${JSON.stringify('behavior-synthesis')}`
    )
  );
  edgeLines.push(renderEdge([inactiveNodeId], 'PROCESS', [sinkNodeId]));
  edgeLines.push(renderEdge([verdictNodeId], 'PROCESS', [sinkNodeId]));

  for (const interventionNode of interventionNodeIds) {
    const targetNodeId =
      interventionNode.kind === 'leverage' ? resultBranchNodeId : thenBranchNodeId;
    const mode =
      interventionNode.kind === 'leverage' ? 'constructive' : 'destructive';
    edgeLines.push(
      renderEdge(
        [interventionNode.nodeId],
        'INTERFERE',
        [targetNodeId],
        `mode: ${JSON.stringify(mode)}`
      )
    );
  }

  return [
    `// behavioral-loop-${loop.id}.gg`,
    `// Executable Gnosis projection for ${loop.name}.`,
    '',
    '// Nodes',
    ...Array.from(nodeLines).sort(),
    '',
    '// Topology',
    ...edgeLines,
  ].join('\n');
}

export async function executeBehavioralLoop(
  loop: BehavioralLoopRecord,
  context: BehavioralExecutionContext = {}
): Promise<BehavioralLoopExecution> {
  const topologySource = buildBehavioralLoopExecutionTopology(loop);
  const compiler = new BettyCompiler();
  const { ast, diagnostics } = compiler.parse(topologySource);

  if (!ast) {
    throw new Error(
      `Unable to parse executable topology for loop ${loop.id}: ${formatBehaviorParseDiagnostics(diagnostics)}`
    );
  }

  const engine = new GnosisEngine(createBehavioralExecutionRegistry());
  const execution = await engine.executeWithResult(ast, context);
  if (!isBehavioralExecutionPayload(execution.payload)) {
    throw new Error(`Behavioral loop ${loop.id} produced an invalid execution payload.`);
  }

  return {
    topologySource,
    logs: execution.logs,
    payload: execution.payload,
  };
}

async function buildBehavioralLoopArtifactManifest(
  datasetPath: string,
  outputDirectory: string,
  selection: BehavioralTaxonomySelection
): Promise<BehavioralLoopArtifactManifest> {
  mkdirSync(outputDirectory, { recursive: true });

  const entries: BehavioralLoopArtifactManifestEntry[] = [];
  const loopIdCounts = new Map<number, number>();

  for (const loop of selection.loops) {
    loopIdCounts.set(loop.id, (loopIdCounts.get(loop.id) ?? 0) + 1);
  }

  for (const category of selection.categories) {
    for (const loop of category.loops) {
      const topologySource = buildBehavioralLoopExecutionTopology(loop);
      const report = await analyzeGnosisSource(topologySource);
      const disambiguate = (loopIdCounts.get(loop.id) ?? 0) > 1;
      const artifactBaseName = getBehavioralLoopArtifactBaseName(
        category,
        loop,
        disambiguate
      );
      const tlaModuleName = getBehavioralLoopTlaModuleName(
        category,
        loop,
        disambiguate
      );
      const tlaBridge = generateTlaFromGnosisSource(topologySource, {
        moduleName: tlaModuleName,
        sourceFilePath: `${artifactBaseName}.gg`,
      });
      const topologyFile = `${artifactBaseName}.gg`;
      const tlaFile = `${artifactBaseName}.tla`;
      const cfgFile = `${artifactBaseName}.cfg`;

      writeFileSync(path.join(outputDirectory, topologyFile), topologySource);
      writeFileSync(path.join(outputDirectory, tlaFile), tlaBridge.tla);
      writeFileSync(path.join(outputDirectory, cfgFile), tlaBridge.cfg);

      entries.push({
        categoryId: category.id,
        categoryName: category.name,
        loopId: loop.id,
        loopName: loop.name,
        topologyFile,
        tlaFile,
        cfgFile,
        tlaModuleName,
        buleyNumber: report.buleyNumber,
        wallaceNumber: report.steering.wallaceNumber,
        quantumIndex: report.quantum.quantumIndex,
        topology: {
          nodeCount: report.topology.nodeCount,
          edgeCount: report.topology.edgeCount,
          structuralBeta1: report.topology.structuralBeta1,
          forkEdgeCount: report.topology.forkEdgeCount,
          foldEdgeCount: report.topology.foldEdgeCount,
          interfereEdgeCount: report.topology.interfereEdgeCount,
          maxBranchFactor: report.topology.maxBranchFactor,
        },
        tlaStats: tlaBridge.stats,
      });
    }
  }

  entries.sort((left, right) => left.loopId - right.loopId);

  return {
    datasetPath,
    outputDirectory,
    generatedAt: new Date().toISOString(),
    selectedCategoryCount: selection.categories.length,
    selectedLoopCount: selection.loops.length,
    entries,
  };
}

export async function writeBehavioralLoopExecutionArtifacts(
  options: BehavioralLoopArtifactWriteOptions
): Promise<BehavioralLoopArtifactManifest> {
  const { dataset, datasetPath } = loadBehavioralLoopsDataset(options.sourcePath);
  const selection = selectBehavioralTaxonomy(dataset, options);
  const outputDirectory = path.resolve(process.cwd(), options.outputDirectory);
  const manifest = await buildBehavioralLoopArtifactManifest(
    datasetPath,
    outputDirectory,
    selection
  );

  writeFileSync(
    path.join(outputDirectory, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  return manifest;
}

interface ParsedCliArgs {
  sourcePath?: string;
  categoryIds: string[];
  loopIds: number[];
  writeTopologyPath?: string;
  writeLoopExecutionsPath?: string;
  json: boolean;
  help: boolean;
}

function parseCliArgs(rawArgs: string[]): ParsedCliArgs {
  const parsed: ParsedCliArgs = {
    categoryIds: [],
    loopIds: [],
    json: false,
    help: false,
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    switch (arg) {
      case '--source': {
        parsed.sourcePath = rawArgs[index + 1];
        index += 1;
        break;
      }
      case '--category': {
        const categoryId = rawArgs[index + 1];
        if (categoryId) {
          parsed.categoryIds.push(categoryId);
        }
        index += 1;
        break;
      }
      case '--loop-id': {
        const rawLoopId = rawArgs[index + 1];
        const loopId = rawLoopId ? Number.parseInt(rawLoopId, 10) : Number.NaN;
        if (Number.isFinite(loopId)) {
          parsed.loopIds.push(loopId);
        }
        index += 1;
        break;
      }
      case '--write-topology': {
        parsed.writeTopologyPath = rawArgs[index + 1];
        index += 1;
        break;
      }
      case '--write-loop-executions': {
        parsed.writeLoopExecutionsPath = rawArgs[index + 1];
        index += 1;
        break;
      }
      case '--json': {
        parsed.json = true;
        break;
      }
      case '--help':
      case '-h': {
        parsed.help = true;
        break;
      }
      default:
        break;
    }
  }

  return parsed;
}

function getHelpText(): string {
  return [
    'Measure the Gnosis buley number for the behavioral-taxonomy corpus.',
    '',
    'Usage:',
    '  bun open-source/gnosis/src/behavioral-taxonomy.ts [options]',
    '',
    'Options:',
    '  --source <path>           Override the dataset JSON path.',
    '  --category <id>          Restrict measurement to a category (repeatable).',
    '  --loop-id <id>           Restrict measurement to a loop id (repeatable).',
    '  --write-topology <path>  Write the generated .gg topology to disk.',
    '  --write-loop-executions <dir>',
    '                           Write per-loop .gg/.tla/.cfg artifacts plus manifest.json.',
    '  --json                   Emit machine-readable output.',
    '  --help                   Show this help text.',
  ].join('\n');
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    console.log(getHelpText());
    return;
  }

  const measurement = await measureBehavioralTaxonomy({
    sourcePath: args.sourcePath,
    categoryIds: args.categoryIds,
    loopIds: args.loopIds,
    writeTopologyPath: args.writeTopologyPath,
  });
  const loopArtifacts = args.writeLoopExecutionsPath
    ? await writeBehavioralLoopExecutionArtifacts({
        sourcePath: args.sourcePath,
        categoryIds: args.categoryIds,
        loopIds: args.loopIds,
        outputDirectory: args.writeLoopExecutionsPath,
      })
    : null;

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          datasetPath: measurement.datasetPath,
          selectedCategoryCount: measurement.selectedCategoryCount,
          selectedLoopCount: measurement.selectedLoopCount,
          report: measurement.report,
          writeTopologyPath: args.writeTopologyPath
            ? path.resolve(process.cwd(), args.writeTopologyPath)
            : null,
          writeLoopExecutionsPath: loopArtifacts?.outputDirectory ?? null,
        },
        null,
        2
      )
    );
    return;
  }

  console.log(formatBehavioralTaxonomyMeasurement(measurement));
  if (args.writeTopologyPath) {
    console.log(
      `topology-written: ${path.resolve(process.cwd(), args.writeTopologyPath)}`
    );
  }
  if (loopArtifacts) {
    console.log(`loop-artifacts-written: ${loopArtifacts.outputDirectory}`);
    console.log(
      `loop-artifact-count: ${loopArtifacts.selectedLoopCount} (.gg/.tla/.cfg plus manifest.json)`
    );
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  await main();
}
