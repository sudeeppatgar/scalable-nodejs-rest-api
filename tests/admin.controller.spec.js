import { jest } from '@jest/globals';

const mockService = {
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserActivities: jest.fn(),
};

jest.unstable_mockModule('../src/services/admin.service.js', () => ({
  __esModule: true,
  default: mockService,
}));

const { default: adminController } = await import('../src/controllers/admin.controller.js');

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
  query: {},
  params: {},
  body: {},
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('jest-agent'),
  user: { _id: { toString: () => 'admin1' } },
  ...overrides,
});

const metadata = { ipAddress: '127.0.0.1', userAgent: 'jest-agent' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AdminController.getAllUsers', () => {
  it('delegates query params to service and responds 200', async () => {
    const result = { users: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
    mockService.getAllUsers.mockResolvedValue(result);

    await adminController.getAllUsers(buildReq({ query: { page: '1', limit: '10' } }), buildRes());

    expect(mockService.getAllUsers).toHaveBeenCalledWith({ page: '1', limit: '10' });
  });
});

describe('AdminController.getUserById', () => {
  it('delegates id param to service', async () => {
    mockService.getUserById.mockResolvedValue({ id: 'u1' });
    const res = buildRes();

    await adminController.getUserById(buildReq({ params: { id: 'u1' } }), res);

    expect(mockService.getUserById).toHaveBeenCalledWith('u1');
    expect(res.statusCode).toBe(200);
  });
});

describe('AdminController.updateUser', () => {
  it('passes id, body and admin id to service and responds 200', async () => {
    mockService.updateUser.mockResolvedValue({ id: 'u1', name: 'X' });
    const res = buildRes();

    await adminController.updateUser(buildReq({ params: { id: 'u1' }, body: { name: 'X' } }), res);

    expect(mockService.updateUser).toHaveBeenCalledWith('u1', { name: 'X' }, 'admin1', metadata);
    expect(res.statusCode).toBe(200);
  });
});

describe('AdminController.deleteUser', () => {
  it('passes id and admin id to service and responds 200', async () => {
    mockService.deleteUser.mockResolvedValue(undefined);
    const res = buildRes();

    await adminController.deleteUser(buildReq({ params: { id: 'u1' } }), res);

    expect(mockService.deleteUser).toHaveBeenCalledWith('u1', 'admin1', metadata);
    expect(res.statusCode).toBe(200);
  });
});

describe('AdminController.getUserActivities', () => {
  it('defaults limit and skip when query params absent', async () => {
    mockService.getUserActivities.mockResolvedValue([]);
    const res = buildRes();

    await adminController.getUserActivities(buildReq({ params: { id: 'u1' } }), res);

    expect(mockService.getUserActivities).toHaveBeenCalledWith('u1', { limit: 50, skip: 0 });
    expect(res.statusCode).toBe(200);
  });

  it('parses limit and skip from query params', async () => {
    mockService.getUserActivities.mockResolvedValue([]);
    const res = buildRes();

    await adminController.getUserActivities(
      buildReq({ params: { id: 'u1' }, query: { limit: '20', skip: '5' } }),
      res,
    );

    expect(mockService.getUserActivities).toHaveBeenCalledWith('u1', { limit: 20, skip: 5 });
  });
});
