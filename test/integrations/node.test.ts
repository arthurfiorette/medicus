import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Medicus } from '../../src';
import { nodeMedicusPlugin } from '../../src/integrations/node';

describe('nodeMedicusPlugin', () => {
  it('registers correctly', async () => {
    using medicus = new Medicus({
      plugins: [nodeMedicusPlugin()]
    });

    const checkers = Array.from(medicus.listCheckersEntries());

    assert.equal(checkers.length, 1);
    assert.equal(checkers[0]![0], 'node');
  });

  it('registers correctly with different name', async () => {
    const checkerName = 'node-checker';

    using medicus = new Medicus({
      plugins: [
        nodeMedicusPlugin({
          checkerName
        })
      ]
    });

    const checkers = Array.from(medicus.listCheckersEntries());

    assert.equal(checkers.length, 1);
    assert.equal(checkers[0]![0], checkerName);
  });

  it('debugs by default', async () => {
    using medicus = new Medicus({
      plugins: [nodeMedicusPlugin({})]
    });

    const result = await medicus.performCheck(true);

    const debug = result.services.node?.debug;

    assert.ok(debug);
    assert.ok(Object.keys(debug!).length > 0);
  });

  it('disables debug', async () => {
    using medicus = new Medicus({
      plugins: [nodeMedicusPlugin({ debug: false })]
    });

    const result = await medicus.performCheck(true);

    assert.deepStrictEqual(result.services.node?.debug, undefined);
  });
});
