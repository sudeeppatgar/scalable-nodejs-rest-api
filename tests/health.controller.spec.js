import { jest } from '@jest/globals';

const connectionState = { readyState: 1 };
const redisState = { connected: true };

jest.unstable_mockModule('mongoose', () => ({
  __esModule: true,
  default: { connection: connectionState },
}));

jest.unstable_mockModule('../src/config/redis.js', () => ({
  __esModule: true,
  default: {
    isConnected: () => redisState.connected,
  },
}));

const { healthCheck } = await import('../src/controllers/health.controller.js');

const buildRes = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

describe('HealthController.healthCheck', () => {
  it('reports ok with 200 when all services are connected', async () => {
    connectionState.readyState = 1;
    redisState.connected = true;
    const res = buildRes();

    await healthCheck({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.services).toEqual({ database: 'connected', redis: 'connected' });
    expect(res.body.data.timestamp).toEqual(expect.any(String));
  });

  it('reports degraded with 503 when database is disconnected', async () => {
    connectionState.readyState = 2;
    redisState.connected = true;
    const res = buildRes();

    await healthCheck({}, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.data.status).toBe('degraded');
  });

  it('reports degraded with 503 when redis is disconnected', async () => {
    connectionState.readyState = 1;
    redisState.connected = false;
    const res = buildRes();

    await healthCheck({}, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.data.services.redis).toBe('disconnected');
  });
});
