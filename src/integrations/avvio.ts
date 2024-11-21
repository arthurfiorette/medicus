import type avvio from 'avvio';
import { Medicus } from '../medicus';
import type { MedicusOption } from '../types';

/** The medicus type alias with its context adapted to avvio */
export type AvvioMedicus<Ctx> = Medicus<avvio.mixedInstance<Ctx>>;

/** The options type alias for the avvio medicus plugin */
export type AvvioMedicusOptions<Ctx> = MedicusOption<avvio.mixedInstance<Ctx>>;

/**
 * A basic avvio plugin that registers a medicus instance
 *
 * @example
 *
 * ```ts
 * type Context = {
 *   medicus: AvvioMedicus<Context>;
 * };
 *
 * // medicus is added later by the plugin
 * const app = avvio({} as Context);
 *
 * app.use(
 *   avvioMedicusPlugin({
 *     // options...
 *   })
 * );
 * ```
 */
export function avvioMedicusPlugin<Ctx extends { medicus: AvvioMedicus<Ctx> }>(
  options: Omit<MedicusOption<Ctx>, 'context'>
) {
  // I could not manage to make avvio typings work, totally skill issue on my part
  return function medicusPlugin(
    server: avvio.mixedInstance<Ctx>,
    _: undefined,
    done: (err?: Error) => void
  ) {
    server.medicus ??= new Medicus({
      ...options,
      // auto inject context
      context: server
    });

    // Clears the background check on close
    server.onClose((instance, done) => {
      instance.medicus.stopBackgroundCheck();
      return done();
    });

    return done();
  };
}
