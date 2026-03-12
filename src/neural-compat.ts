import { checkGgProgram } from '@affectively/aeon-logic';
import { Pipeline } from '@affectively/aeon-pipelines';

export interface Neuron {
  id: string;
  type: 'input' | 'hidden' | 'output' | 'cloud';
  bias: number;
  activation: string;
}

export interface Synapse {
  id: string;
  from_id: string;
  to_id: string;
  weight: number;
}

export interface AdapterTrainingConfig {
  rank: number;
  basePrecision: 'int8' | 'fp16' | 'fp32';
  adapterPrecision: 'fp16' | 'fp32';
  microBatchSize: number;
  idleFlushMs: number;
}

export interface NeuralGraphData {
  nodeCount: number;
  nodes: Array<{
    id: string;
    index: number;
    type: Neuron['type'];
  }>;
  edges: Array<{
    id: string;
    source: number;
    target: number;
    weight: number;
  }>;
}

const DEFAULT_TRAINING_IGNORE_TARGET = -999;

export const TRANSFORMER_HELLO_WORLD_TOPOLOGY = `
(input: Tensor)-[:FORK]->(query | key | value)
(query)-[:FORK]->(head_0 | head_1 | head_2 | head_3)
(key)-[:PROCESS]->(head_0)
(key)-[:PROCESS]->(head_1)
(key)-[:PROCESS]->(head_2)
(key)-[:PROCESS]->(head_3)
(value)-[:PROCESS]->(head_0)
(value)-[:PROCESS]->(head_1)
(value)-[:PROCESS]->(head_2)
(value)-[:PROCESS]->(head_3)
(head_0 | head_1 | head_2 | head_3)-[:FOLD { strategy: "concat" }]->(residual_mix)
(residual_mix | input)-[:INTERFERE { mode: "constructive" }]->(output)
`.trim();

type TrainingEvent = { type: 'loss' | 'epoch'; value: number };

interface NeuralStore {
  neurons: Map<string, Neuron>;
  synapses: Map<string, Synapse>;
  semanticDescriptions: Map<string, string>;
}

export class Translator {
  private idToIndex = new Map<string, number>();

  flatten(
    neurons: Neuron[],
    synapses: Synapse[]
  ): {
    size: number;
    weights: Float32Array;
    biases: Float32Array;
    initialValues: Float32Array;
  } {
    const size = neurons.length;
    this.idToIndex.clear();

    for (let index = 0; index < neurons.length; index++) {
      this.idToIndex.set(neurons[index].id, index);
    }

    const biases = new Float32Array(size);
    const initialValues = new Float32Array(size);
    for (let index = 0; index < neurons.length; index++) {
      biases[index] = neurons[index].bias;
      initialValues[index] = 0;
    }

    const weights = new Float32Array(size * size);
    for (const synapse of synapses) {
      const fromIndex = this.idToIndex.get(synapse.from_id);
      const toIndex = this.idToIndex.get(synapse.to_id);
      if (fromIndex === undefined || toIndex === undefined) {
        continue;
      }
      weights[toIndex * size + fromIndex] = synapse.weight;
    }

    return { size, weights, biases, initialValues };
  }
}

export class NeuronRepository {
  constructor(private readonly store: NeuralStore) {}

  async create(neuron: Neuron): Promise<void> {
    this.store.neurons.set(neuron.id, { ...neuron });
  }

  async createWithSemantics(
    neuron: Neuron,
    description: string
  ): Promise<void> {
    await this.create(neuron);
    this.store.semanticDescriptions.set(neuron.id, description);
  }

  async getAll(): Promise<Neuron[]> {
    return Array.from(this.store.neurons.values());
  }

  async delete(id: string): Promise<void> {
    this.store.neurons.delete(id);
    this.store.semanticDescriptions.delete(id);
  }
}

export class SynapseRepository {
  constructor(private readonly store: NeuralStore) {}

  async create(synapse: Synapse): Promise<void> {
    this.store.synapses.set(synapse.id, { ...synapse });
  }

  async getAll(): Promise<Synapse[]> {
    return Array.from(this.store.synapses.values());
  }

  async delete(id: string): Promise<void> {
    this.store.synapses.delete(id);
  }
}

export class GPUEngine {
  networkSize = 0;
  batchSize = 1;

  private initialized = false;
  private weights = new Float32Array();
  private biases = new Float32Array();
  private targets = new Float32Array();
  private learningRate = 0.001;
  private latestInputs = new Float32Array();
  private latestOutputs = new Float32Array();
  private readonly subscribers = new Set<(event: TrainingEvent) => void>();
  private readonly translator = new Translator();
  private readonly neuronDefinitions = new Map<string, Neuron>();
  private readonly synapseDefinitions = new Map<string, Synapse>();

  async init(): Promise<void> {
    this.initialized = true;
  }

  prepareBuffers(
    size: number,
    weights: Float32Array,
    biases: Float32Array,
    batchSize = 1
  ): void {
    if (!this.initialized) {
      throw new Error('GPUEngine not initialized');
    }

    if (size <= 0) {
      throw new Error('Network size must be > 0');
    }

    if (weights.length !== size * size) {
      throw new Error(
        `Weight matrix size mismatch. Expected ${size * size}, got ${
          weights.length
        }`
      );
    }

    if (biases.length !== size) {
      throw new Error(
        `Bias vector size mismatch. Expected ${size}, got ${biases.length}`
      );
    }

    this.networkSize = size;
    this.batchSize = Math.max(1, batchSize);
    this.weights = new Float32Array(weights);
    this.biases = new Float32Array(biases);

    const expectedTargetSize = this.networkSize * this.batchSize;
    if (this.targets.length !== expectedTargetSize) {
      this.targets = new Float32Array(expectedTargetSize).fill(
        DEFAULT_TRAINING_IGNORE_TARGET
      );
    }
  }

  prepareTrainingBuffers(targets: Float32Array, learningRate: number): void {
    if (!this.initialized || this.networkSize === 0) {
      throw new Error('GPU not ready for training');
    }

    const expectedTargetSize = this.networkSize * this.batchSize;
    if (targets.length !== expectedTargetSize) {
      throw new Error(
        `Target size mismatch. Expected ${expectedTargetSize}, got ${targets.length}`
      );
    }

    this.targets = new Float32Array(targets);
    this.learningRate = learningRate;
  }

  async runTick(inputs: Float32Array): Promise<Float32Array> {
    if (!this.initialized) {
      throw new Error('GPUEngine not initialized');
    }

    this.compileGraphDefinitionsIfNeeded();

    const expectedInputSize = this.networkSize * this.batchSize;
    if (inputs.length !== expectedInputSize) {
      throw new Error(
        `Input size mismatch. Expected ${expectedInputSize}, got ${inputs.length}`
      );
    }

    this.latestInputs = new Float32Array(inputs);

    const workFns: Array<() => Promise<Float32Array>> = [];
    for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
      const offset = batchIndex * this.networkSize;
      const batchInput = inputs.slice(offset, offset + this.networkSize);
      workFns.push(async () => this.forwardOneBatch(batchInput));
    }

    const flattened = await Pipeline.from(workFns).fold({
      type: 'merge-all',
      merge: (results) => {
        const ordered = Array.from(results.entries())
          .sort(([left], [right]) => left - right)
          .map(([, value]) => value);
        const output = new Float32Array(this.networkSize * this.batchSize);
        for (let index = 0; index < ordered.length; index++) {
          output.set(ordered[index], index * this.networkSize);
        }
        return output;
      },
    });

    this.latestOutputs = new Float32Array(flattened);
    return new Float32Array(flattened);
  }

  async train(
    inputs: Float32Array,
    targets: Float32Array
  ): Promise<Float32Array> {
    const outputs = await this.runTick(inputs);
    this.prepareTrainingBuffers(targets, this.learningRate);
    const meanLoss = this.applySingleLayerGradientStep();
    this.emit({ type: 'loss', value: meanLoss });
    this.emit({ type: 'epoch', value: 1 });
    return outputs;
  }

  async trainTick(): Promise<void> {
    if (this.latestInputs.length === 0 || this.latestOutputs.length === 0) {
      throw new Error('No forward pass available for trainTick');
    }

    const meanLoss = this.applySingleLayerGradientStep();
    this.emit({ type: 'loss', value: meanLoss });
    this.emit({ type: 'epoch', value: 1 });
  }

  subscribe(callback: (event: TrainingEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  async injectInput(data: Float32Array): Promise<void> {
    if (!this.initialized || this.networkSize === 0) {
      return;
    }

    const expectedLength = this.networkSize * this.batchSize;
    const nextInputs = new Float32Array(expectedLength);
    nextInputs.set(data.slice(0, expectedLength));
    this.latestInputs = nextInputs;
  }

  async createNeuron(neuron: {
    id: string;
    type: Neuron['type'];
    bias: number;
    activation: string;
  }): Promise<void> {
    this.neuronDefinitions.set(neuron.id, {
      id: neuron.id,
      type: neuron.type,
      bias: neuron.bias,
      activation: neuron.activation,
    });
  }

  async createSynapse(synapse: {
    from: string;
    to: string;
    weight: number;
  }): Promise<void> {
    const id = `${synapse.from}->${synapse.to}`;
    this.synapseDefinitions.set(id, {
      id,
      from_id: synapse.from,
      to_id: synapse.to,
      weight: synapse.weight,
    });
  }

  async uploadBuffer(_buffer: unknown, _data: Float32Array): Promise<void> {
    // Compatibility no-op for browser adapters that expect this method.
  }

  async getWeights(): Promise<Float32Array[]> {
    return [new Float32Array(this.weights)];
  }

  async getBiases(): Promise<Float32Array[]> {
    return [new Float32Array(this.biases)];
  }

  private compileGraphDefinitionsIfNeeded(): void {
    if (
      this.weights.length > 0 ||
      this.neuronDefinitions.size === 0 ||
      !this.initialized
    ) {
      return;
    }

    const neurons = Array.from(this.neuronDefinitions.values());
    const synapses = Array.from(this.synapseDefinitions.values());
    const flattened = this.translator.flatten(neurons, synapses);

    this.prepareBuffers(
      flattened.size,
      flattened.weights,
      flattened.biases,
      this.batchSize
    );
  }

  private forwardOneBatch(input: Float32Array): Float32Array {
    const output = new Float32Array(this.networkSize);

    for (let targetNeuronIndex = 0; targetNeuronIndex < this.networkSize; targetNeuronIndex++) {
      let sum = this.biases[targetNeuronIndex] ?? 0;
      const rowOffset = targetNeuronIndex * this.networkSize;

      for (
        let sourceNeuronIndex = 0;
        sourceNeuronIndex < this.networkSize;
        sourceNeuronIndex++
      ) {
        const weight = this.weights[rowOffset + sourceNeuronIndex] ?? 0;
        sum += weight * (input[sourceNeuronIndex] ?? 0);
      }

      output[targetNeuronIndex] = Math.tanh(sum);
    }

    return output;
  }

  private applySingleLayerGradientStep(): number {
    if (
      this.networkSize === 0 ||
      this.latestInputs.length === 0 ||
      this.latestOutputs.length === 0
    ) {
      return 0;
    }

    let totalLoss = 0;
    let validTargetCount = 0;
    const normalizer = this.batchSize <= 0 ? 1 : this.batchSize;

    for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
      const batchOffset = batchIndex * this.networkSize;

      for (
        let targetNeuronIndex = 0;
        targetNeuronIndex < this.networkSize;
        targetNeuronIndex++
      ) {
        const targetIndex = batchOffset + targetNeuronIndex;
        const targetValue = this.targets[targetIndex];
        if (targetValue <= DEFAULT_TRAINING_IGNORE_TARGET + 1) {
          continue;
        }

        const outputValue = this.latestOutputs[targetIndex] ?? 0;
        const error = outputValue - targetValue;
        totalLoss += 0.5 * error * error;
        validTargetCount++;

        const rowOffset = targetNeuronIndex * this.networkSize;
        for (
          let sourceNeuronIndex = 0;
          sourceNeuronIndex < this.networkSize;
          sourceNeuronIndex++
        ) {
          const inputValue =
            this.latestInputs[batchOffset + sourceNeuronIndex] ?? 0;
          const gradient = (error * inputValue) / normalizer;
          this.weights[rowOffset + sourceNeuronIndex] -=
            this.learningRate * gradient;
        }

        this.biases[targetNeuronIndex] -= this.learningRate * (error / normalizer);
      }
    }

    if (validTargetCount === 0) {
      return 0;
    }

    return totalLoss / validTargetCount;
  }

  private emit(event: TrainingEvent): void {
    for (const subscriber of this.subscribers) {
      subscriber(event);
    }
  }
}

export class WebNNEngine extends GPUEngine {
  context: unknown = null;
  builder: unknown = null;
  graph: unknown = null;
  isReady = false;

  override async init(): Promise<void> {
    await super.init();
    const globalNavigator =
      typeof navigator === 'undefined'
        ? undefined
        : (navigator as Navigator & { ml?: unknown });
    this.isReady = Boolean(globalNavigator?.ml);
  }

  async prepareModel(
    size: number,
    weights: Float32Array,
    biases: Float32Array,
    batchSize = 1
  ): Promise<void> {
    this.prepareBuffers(size, weights, biases, batchSize);
  }
}

let topologyVerification: Promise<void> | null = null;

async function verifyTransformerTopology(): Promise<void> {
  if (!topologyVerification) {
    topologyVerification = (async () => {
      const result = await checkGgProgram(TRANSFORMER_HELLO_WORLD_TOPOLOGY, {
        defaults: {
          maxDepth: 64,
          maxBeta1Exclusive: 24,
        },
      });

      if (!result.ok) {
        const message = result.violations
          .map((violation) => violation.message)
          .join('; ');
        throw new Error(
          `Transformer hello-world topology is invalid: ${message}`
        );
      }
    })();
  }

  await topologyVerification;
}

export class NeuralEngine {
  gpu: GPUEngine;
  npu: WebNNEngine;
  neuronRepo: NeuronRepository;
  synapseRepo: SynapseRepository;
  translator: Translator;
  activeBackend: 'gpu' | 'npu' = 'gpu';
  adapterTrainingConfig: AdapterTrainingConfig = {
    rank: 8,
    basePrecision: 'int8',
    adapterPrecision: 'fp16',
    microBatchSize: 16,
    idleFlushMs: 45_000,
  };

  private readonly store: NeuralStore = {
    neurons: new Map(),
    synapses: new Map(),
    semanticDescriptions: new Map(),
  };

  private neurons: Neuron[] = [];
  private synapses: Synapse[] = [];

  constructor(private readonly topologySource = TRANSFORMER_HELLO_WORLD_TOPOLOGY) {
    this.gpu = new GPUEngine();
    this.npu = new WebNNEngine();
    this.neuronRepo = new NeuronRepository(this.store);
    this.synapseRepo = new SynapseRepository(this.store);
    this.translator = new Translator();
  }

  async init(): Promise<NeuralGraphData> {
    await verifyTransformerTopology();
    await this.gpu.init();
    this.gpu.batchSize = Math.max(1, this.adapterTrainingConfig.microBatchSize);

    await this.npu.init();
    if (this.npu.isReady) {
      this.activeBackend = 'npu';
    }

    await this.seedGraphIfEmpty();
    await this.compile();
    return this.getGraphData();
  }

  async compile(): Promise<{
    size: number;
    weights: Float32Array;
    biases: Float32Array;
    initialValues: Float32Array;
  }> {
    this.neurons = await this.neuronRepo.getAll();
    this.synapses = await this.synapseRepo.getAll();

    const flattened = this.translator.flatten(this.neurons, this.synapses);
    this.gpu.prepareBuffers(
      flattened.size,
      flattened.weights,
      flattened.biases,
      this.gpu.batchSize
    );

    const targetSize = flattened.size * this.gpu.batchSize;
    this.gpu.prepareTrainingBuffers(
      new Float32Array(targetSize).fill(DEFAULT_TRAINING_IGNORE_TARGET),
      0.001
    );

    if (this.npu.isReady) {
      await this.npu.prepareModel(
        flattened.size,
        flattened.weights,
        flattened.biases,
        this.gpu.batchSize
      );
    }

    return flattened;
  }

  async runTick(inputs: Float32Array): Promise<Float32Array> {
    if (this.activeBackend === 'npu' && this.npu.isReady) {
      return this.npu.runTick(inputs);
    }
    return this.gpu.runTick(inputs);
  }

  async forward(inputs: Float32Array): Promise<Float32Array> {
    return this.runTick(inputs);
  }

  async train(
    inputs: Float32Array,
    targets: Float32Array
  ): Promise<Float32Array> {
    return this.gpu.train(inputs, targets);
  }

  async deployToCloud(): Promise<NeuralGraphData> {
    for (let index = 0; index < this.neurons.length; index++) {
      if (index % 5 === 0) {
        const neuron = this.neurons[index];
        await this.neuronRepo.create({
          ...neuron,
          type: 'cloud',
        });
      }
    }

    this.neurons = await this.neuronRepo.getAll();
    return this.getGraphData();
  }

  setAdapterTrainingConfig(config: Partial<AdapterTrainingConfig>): void {
    this.adapterTrainingConfig = {
      ...this.adapterTrainingConfig,
      ...config,
    };
    this.gpu.batchSize = Math.max(
      1,
      this.adapterTrainingConfig.microBatchSize
    );
  }

  getAdapterTrainingConfig(): AdapterTrainingConfig {
    return { ...this.adapterTrainingConfig };
  }

  getMemoryStats(): { totalNodes: number; totalConnections: number } {
    return {
      totalNodes: this.neurons.length,
      totalConnections: this.synapses.length,
    };
  }

  getGraphData(): NeuralGraphData {
    const neuronToIndex = new Map<string, number>();
    this.neurons.forEach((neuron, index) => {
      neuronToIndex.set(neuron.id, index);
    });

    return {
      nodeCount: this.neurons.length,
      nodes: this.neurons.map((neuron, index) => ({
        id: neuron.id,
        index,
        type: neuron.type,
      })),
      edges: this.synapses.map((synapse) => ({
        id: synapse.id,
        source: neuronToIndex.get(synapse.from_id) ?? 0,
        target: neuronToIndex.get(synapse.to_id) ?? 0,
        weight: synapse.weight,
      })),
    };
  }

  async deleteSynapse(id: string): Promise<NeuralGraphData> {
    await this.synapseRepo.delete(id);
    this.synapses = await this.synapseRepo.getAll();
    await this.compile();
    return this.getGraphData();
  }

  exportGraph(): { version: string; neurons: Neuron[]; synapses: Synapse[] } {
    return {
      version: 'gnosis-neural-1.0',
      neurons: [...this.neurons],
      synapses: [...this.synapses],
    };
  }

  async importGraph(data: {
    neurons: Neuron[];
    synapses: Synapse[];
  }): Promise<NeuralGraphData> {
    if (!Array.isArray(data.neurons) || !Array.isArray(data.synapses)) {
      throw new Error('Invalid graph data');
    }

    this.store.neurons.clear();
    this.store.synapses.clear();

    for (const neuron of data.neurons) {
      await this.neuronRepo.create(neuron);
    }

    for (const synapse of data.synapses) {
      await this.synapseRepo.create(synapse);
    }

    this.neurons = await this.neuronRepo.getAll();
    this.synapses = await this.synapseRepo.getAll();
    await this.compile();
    return this.getGraphData();
  }

  private async seedGraphIfEmpty(): Promise<void> {
    const existingNeurons = await this.neuronRepo.getAll();
    if (existingNeurons.length > 0) {
      this.neurons = existingNeurons;
      this.synapses = await this.synapseRepo.getAll();
      return;
    }

    const seededNeurons: Neuron[] = [
      {
        id: 'token_input',
        type: 'input',
        bias: 0,
        activation: 'tanh',
      },
      {
        id: 'attention_hidden',
        type: 'hidden',
        bias: 0.05,
        activation: 'tanh',
      },
      {
        id: 'residual_hidden',
        type: 'hidden',
        bias: 0.1,
        activation: 'tanh',
      },
      {
        id: 'token_output',
        type: 'output',
        bias: 0,
        activation: 'tanh',
      },
    ];

    const seededSynapses: Synapse[] = [
      {
        id: 'synapse_input_attention',
        from_id: 'token_input',
        to_id: 'attention_hidden',
        weight: 0.8,
      },
      {
        id: 'synapse_attention_residual',
        from_id: 'attention_hidden',
        to_id: 'residual_hidden',
        weight: 0.6,
      },
      {
        id: 'synapse_residual_output',
        from_id: 'residual_hidden',
        to_id: 'token_output',
        weight: 0.9,
      },
      {
        id: 'synapse_skip',
        from_id: 'token_input',
        to_id: 'token_output',
        weight: 0.25,
      },
    ];

    for (const neuron of seededNeurons) {
      await this.neuronRepo.create(neuron);
    }

    for (const synapse of seededSynapses) {
      await this.synapseRepo.create(synapse);
    }

    this.neurons = seededNeurons;
    this.synapses = seededSynapses;
  }
}

export async function init(): Promise<NeuralEngine> {
  const engine = new NeuralEngine();
  await engine.init();
  return engine;
}
