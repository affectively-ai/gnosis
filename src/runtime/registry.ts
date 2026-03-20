import type { GnosisExecutionAuthContext } from '../auth/core.js';
import type { GnosisCoreCache, GnosisCoreCacheSession } from './core-cache.js';

export interface GnosisHandlerContext {
  nodeId?: string;
  sharedState?: unknown;
  signal?: AbortSignal;
  executionAuth?: GnosisExecutionAuthContext;
  coreCache?: GnosisCoreCache;
  cacheSession?: GnosisCoreCacheSession;
}

export type GnosisHandler = (
  payload: any,
  props: Record<string, string>,
  context?: GnosisHandlerContext
) => Promise<any>;

export interface RegisterHandlerOptions {
  override?: boolean;
}

export class GnosisRegistry {
  private handlers = new Map<string, GnosisHandler>();

  public register(
    label: string,
    handler: GnosisHandler,
    options: RegisterHandlerOptions = {}
  ) {
    if (!options.override && this.handlers.has(label)) {
      return;
    }
    this.handlers.set(label, handler);
  }

  public hasHandler(label: string): boolean {
    return this.handlers.has(label);
  }

  public getHandler(label: string): GnosisHandler | undefined {
    return this.handlers.get(label);
  }
}
