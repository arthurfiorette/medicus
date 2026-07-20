import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createApp, toWebHandler } from 'h3';
import { HealthStatus, Medicus } from '../../src';
import { createH3HealthCheckHandler } from '../../src/integrations/h3';

describe('H3 and Nitro Integration', () => {
  it('handles H3 requests and passes the event to checkers', async () => {
    const handler = createH3HealthCheckHandler({
      debug: true,
      headers: { 'x-health': 'medicus' },
      checkers: {
        request(event) {
          return {
            status: HealthStatus.HEALTHY,
            debug: { path: event.path }
          };
        }
      }
    });
    const app = createApp().use(handler);
    const response = await toWebHandler(app)(new Request('http://localhost/health'));
    const body: any = await response.json();

    assert.ok(handler.medicus instanceof Medicus);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-cache, no-store, must-revalidate');
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('x-health'), 'medicus');
    assert.equal(body.services.request.debug.path, '/health');
  });

  it('supports debug, cached, and simulated results', async () => {
    let calls = 0;
    const handler = createH3HealthCheckHandler({
      checkers: {
        service() {
          calls++;
          return {
            status: HealthStatus.HEALTHY,
            debug: { visible: true }
          };
        }
      }
    });
    const app = createApp().use(handler);
    const request = toWebHandler(app);

    const first = await request(new Request('http://localhost/health?debug=true'));
    const firstBody: any = await first.json();
    const cached = await request(new Request('http://localhost/health?last=true'));
    const simulated = await request(new Request('http://localhost/health?simulate=unhealthy'));

    assert.equal(firstBody.services.service.debug.visible, true);
    assert.equal(cached.status, 200);
    assert.equal(calls, 2);
    assert.equal(simulated.status, 503);
  });
});
