import assert from 'node:assert';
import { describe, it } from 'node:test';
import { pino } from 'pino';
import { Medicus } from '../../src';
import { pinoMedicusPlugin } from '../../src/integrations/pino';

describe('pinoMedicusPlugin', () => {
  it('should call pino.error when health check fails', async (ctx) => {
    const pinoInstance = pino({ level: 'silent' });
    const pinoMock = ctx.mock.method(pinoInstance, 'error');

    const medicus = new Medicus({
      plugins: [pinoMedicusPlugin(pinoInstance)],
      checkers: {
        async database() {
          throw new Error('Database check failed');
        }
      }
    });

    assert.equal(pinoMock.mock.callCount(), 0);

    await medicus.performCheck();

    assert.equal(pinoMock.mock.callCount(), 1);
  });
});
