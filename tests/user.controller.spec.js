import { jest } from '@jest/globals';

const mockService = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
};

jest.unstable_mockModule('../src/services/user.service.js', () => ({
  __esModule: true,
  default: mockService,
}));

const { default: userController } = await import('../src/controllers/user.controller.js');

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

describe('UserController.getProfile', () => {
  it('responds 200 with profile', async () => {
    const profile = { id: 'u1', name: 'Alice' };
    mockService.getProfile.mockResolvedValue(profile);
    const res = buildRes();

    await userController.getProfile(buildReq(), res);

    expect(mockService.getProfile).toHaveBeenCalledWith('u1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(profile);
  });
});

describe('UserController.updateProfile', () => {
  it('passes body and metadata to service and responds 200', async () => {
    const updated = { id: 'u1', name: 'Alice 2' };
    mockService.updateProfile.mockResolvedValue(updated);
    const req = buildReq({ body: { name: 'Alice 2' } });
    const res = buildRes();

    await userController.updateProfile(req, res);

    expect(mockService.updateProfile).toHaveBeenCalledWith('u1', { name: 'Alice 2' }, metadata);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(updated);
  });
});

describe('UserController.changePassword', () => {
  it('passes credentials to service and responds 200', async () => {
    const res = buildRes();

    await userController.changePassword(buildReq({ body: { currentPassword: 'a', newPassword: 'b' } }), res);

    expect(mockService.changePassword).toHaveBeenCalledWith('u1', 'a', 'b', metadata);
    expect(res.statusCode).toBe(200);
  });
});
