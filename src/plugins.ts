import type { MedicusPluginFactory } from './types';

/**
 * Simple helper to define a plugin factory
 */
export function definePlugin<O, BaseCtx = any>(
  factory: MedicusPluginFactory<O, BaseCtx>
): MedicusPluginFactory<O, BaseCtx> {
  return <Ctx extends BaseCtx>(options: O) => factory<Ctx>(options);
}
