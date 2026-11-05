import { jest } from '@jest/globals';

const mockService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
};

jest.unstable_mockModule('../src/services/auth.service.js', () => ({
  __esModule: true,
  default: mockService,
}));

const { default: authController } = await import('../src/controllers/auth.controller.js');

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

const buildReq = (overrides = {}) => ({
  body: {},
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('jest-agent'),
  user: { _id: { toString: () => 'u1' } },
  ...overrides,
});

const metadata = { ipAddress: '127.0.0.1', userAgent: 'jest-agent' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthController.register', () => {
  it('responds 201 with service result', async () => {
    const serviceResult = { user: { id: 'u1' }, accessToken: 'at', refreshToken: 'rt' };
    mockService.register.mockResolvedValue(serviceResult);
    const req = buildReq({ body: { name: 'Alice', email: 'a@x.com', password: 'Passw0rd' } });
    const res = buildRes();

    await authController.register(req, res);

    expect(mockService.register).toHaveBeenCalledWith(
      { name: 'Alice', email: 'a@x.com', password: 'Passw0rd' },
      metadata,
    );
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(serviceResult);
  });
});

describe('AuthController.login', () => {
  it('responds 200 with tokens', async () => {
    const serviceResult = { user: { id: 'u1' }, accessToken: 'at', refreshToken: 'rt' };
    mockService.login.mockResolvedValue(serviceResult);
    const req = buildReq({ body: { email: 'a@x.com', password: 'Passw0rd' } });
    const res = buildRes();

    await authController.login(req, res);

    expect(mockService.login).toHaveBeenCalledWith(
      { email: 'a@x.com', password: 'Passw0rd' },
      metadata,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(serviceResult);
  });
});

describe('AuthController.refresh', () => {
  it('responds 400 when refreshToken is missing', async () => {
    const res = buildRes();

    await authController.refresh(buildReq({ body: {} }), res);

    expect(mockService.refreshToken).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('responds 200 with refreshed result', async () => {
    const serviceResult = { accessToken: 'new-at' };
    mockService.refreshToken.mockResolvedValue(serviceResult);
    const req = buildReq({ body: { refreshToken: 'rt' } });
    const res = buildRes();

    await authController.refresh(req, res);

    expect(mockService.refreshToken).toHaveBeenCalledWith('rt');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(serviceResult);
  });
});

describe('AuthController.logout', () => {
  it('responds 200 and delegates to service with user id', async () => {
    mockService.logout.mockResolvedValue(undefined);
    const res = buildRes();

    await authController.logout(buildReq(), res);

    expect(mockService.logout).toHaveBeenCalledWith('u1', metadata);
    expect(res.statusCode).toBe(200);
  });
});
