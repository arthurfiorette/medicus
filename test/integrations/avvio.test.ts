import assert from 'node:assert';
import test, { describe } from 'node:test';
import avvio from 'avvio';
import { Medicus } from '../../src';
import { type AvvioMedicus, avvioMedicusPlugin } from '../../src/integrations/avvio';

describe('avvioMedicusPlugin()', () => {
  test('registers avvio instance', async () => {
    type Context = {
      medicus: AvvioMedicus<Context>;
    };

    const app = avvio({} as Context);

    let run = 0;

    app.use(async (instance) => {
      run++;
      assert.equal(instance.medicus, undefined);
    });

    app.use((instance, _, done) => {
      run++;
      assert.equal(instance.medicus, undefined);
      return done();
    });

    app.use(
      avvioMedicusPlugin({
        backgroundCheckInterval: 1234
        // options...
      })
    );

    app.use(async (instance) => {
      run++;
      assert.ok(instance.medicus instanceof Medicus);
    });

    app.use((instance, _, done) => {
      run++;
      assert.ok(instance.medicus instanceof Medicus);
      return done();
    });

    await app.ready();

    assert.equal(run, 4);

    await new Promise<void>((resolve, reject) => {
      app.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
});
