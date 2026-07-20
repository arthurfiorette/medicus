import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createApp, type H3Event, toWebHandler } from 'h3';
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

  it('supports H3 2 event URLs and the legacy empty URL fallback', async () => {
    const modernHandler = createH3HealthCheckHandler({
      checkers: { service: () => HealthStatus.HEALTHY }
    });
    const modernResponse = await modernHandler({
      url: new URL('http://localhost/health?simulate=unhealthy')
    } as unknown as H3Event);

    const legacyHandler = createH3HealthCheckHandler();
    const legacyResponse = await legacyHandler({
      node: { req: { url: undefined } }
    } as unknown as H3Event);

    assert.equal(modernResponse.status, 503);
    assert.equal(legacyResponse.status, 200);
  });
});
