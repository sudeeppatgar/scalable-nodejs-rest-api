import { jest } from '@jest/globals';

const mockUser = {
  emailExists: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
};

const mockActivity = {
  logActivity: jest.fn(),
};

const mockRcl = {
  isConnected: jest.fn(),
  getClient: jest.fn(),
};

const mockRedisClient = {
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

jest.unstable_mockModule('../src/models/user.model.js', () => ({
  __esModule: true,
  default: mockUser,
}));

jest.unstable_mockModule('../src/models/activity.model.js', () => ({
  __esModule: true,
  default: mockActivity,
}));

jest.unstable_mockModule('../src/config/redis.js', () => ({
  __esModule: true,
  default: mockRcl,
}));

const { default: authService } = await import('../src/services/auth.service.js');
const { generateRefreshToken, verifyAccessToken } = await import('../src/utils/token.js');
const ApiError = (await import('../src/utils/ApiError.js')).default;
const { USER_STATUS } = await import('../src/utils/constants.js');

const buildUser = (overrides = {}) => ({
  _id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'user',
  status: USER_STATUS.ACTIVE,
  password: undefined,
  updateLastLogin: jest.fn().mockResolvedValue(undefined),
  comparePassword: jest.fn().mockResolvedValue(true),
  ...overrides,
});

const metadata = { ipAddress: '127.0.0.1', userAgent: 'jest' };

beforeEach(() => {
  jest.clearAllMocks();
  mockRcl.isConnected.mockReturnValue(true);
  mockRcl.getClient.mockReturnValue(mockRedisClient);
});

describe('AuthService.register', () => {
  it('returns 409 when the email is already taken', async () => {
    mockUser.emailExists.mockResolvedValue(true);

    await expect(authService.register({ name: 'A', email: 'a@x.com', password: 'Passw0rd' }, metadata))
      .rejects.toMatchObject({ statusCode: 409 });

    expect(mockUser.create).not.toHaveBeenCalled();
  });

  it('creates user, generates tokens and stores refresh token in Redis', async () => {
    const user = buildUser();
    mockUser.emailExists.mockResolvedValue(false);
    mockUser.create.mockResolvedValue(user);

    const result = await authService.register({ name: user.name, email: user.email, password: 'Passw0rd' }, metadata);

    expect(mockUser.create).toHaveBeenCalledWith({ name: user.name, email: user.email, password: 'Passw0rd' });
    expect(result.user).toEqual({ id: 'u1', name: user.name, email: user.email, role: 'user' });
    expect(verifyAccessToken(result.accessToken).userId).toBe('u1');
    expect(mockRedisClient.setEx).toHaveBeenCalledWith('refresh_token:u1', 30 * 24 * 60 * 60, result.refreshToken);
    expect(mockActivity.logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: 'register', status: 'success' }));
  });

  it('does not fail registration when Redis is down', async () => {
    const user = buildUser();
    mockUser.emailExists.mockResolvedValue(false);
    mockUser.create.mockResolvedValue(user);
    mockRcl.isConnected.mockReturnValue(false);

    const result = await authService.register({ name: 'A', email: 'a@x.com', password: 'Passw0rd' }, metadata);

    expect(result.accessToken).toBeTruthy();
    expect(mockRedisClient.setEx).not.toHaveBeenCalled();
  });

  it('does not fail registration when activity logging fails', async () => {
    const user = buildUser();
    mockUser.emailExists.mockResolvedValue(false);
    mockUser.create.mockResolvedValue(user);
    mockActivity.logActivity.mockRejectedValue(new Error('db down'));

    const result = await authService.register({ name: 'A', email: 'a@x.com', password: 'Passw0rd' }, metadata);

    expect(result.user.id).toBe('u1');
  });
});

describe('AuthService.login', () => {
  it('returns 401 when user is not found', async () => {
    mockUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await expect(authService.login({ email: 'ghost@x.com', password: 'x' }, metadata))
      .rejects.toMatchObject({ statusCode: 401 });

    expect(mockActivity.logActivity).not.toHaveBeenCalled();
  });

  it('returns 403 and does not verify password for suspended users', async () => {
    const suspended = buildUser({ status: USER_STATUS.SUSPENDED });
    mockUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(suspended) });

    await expect(authService.login({ email: 'alice@example.com', password: 'whatever' }, metadata))
      .rejects.toMatchObject({ statusCode: 403 });

    expect(suspended.comparePassword).not.toHaveBeenCalled();
    expect(suspended.updateLastLogin).not.toHaveBeenCalled();
  });

  it('logs a failed attempt and returns 401 on bad password', async () => {
    const user = buildUser({ comparePassword: jest.fn().mockResolvedValue(false) });
    mockUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    await expect(authService.login({ email: user.email, password: 'wrong' }, metadata))
      .rejects.toMatchObject({ statusCode: 401 });

    expect(mockActivity.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'login', status: 'failed' }),
    );
    expect(user.updateLastLogin).not.toHaveBeenCalled();
  });

  it('updates last login and stores refresh token on success', async () => {
    const user = buildUser();
    mockUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const result = await authService.login({ email: user.email, password: 'Passw0rd' }, metadata);

    expect(user.updateLastLogin).toHaveBeenCalledTimes(1);
    expect(mockRedisClient.setEx).toHaveBeenCalledWith('refresh_token:u1', 30 * 24 * 60 * 60, result.refreshToken);
    expect(mockActivity.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'login', status: 'success' }),
    );
  });
});

describe('AuthService.refreshToken', () => {
  it('returns 401 when stored token does not match', async () => {
    const token = generateRefreshToken('u1');
    mockRedisClient.get.mockResolvedValue('different-token');

    await expect(authService.refreshToken(token)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns 401 when refresh token is not present in Redis but redis is up', async () => {
    const token = generateRefreshToken('u1');
    mockRedisClient.get.mockResolvedValue(null);

    await expect(authService.refreshToken(token)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns 401 when user no longer exists', async () => {
    const token = generateRefreshToken('u1');
    mockRedisClient.get.mockResolvedValue(token);
    mockUser.findById.mockResolvedValue(null);

    await expect(authService.refreshToken(token)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('issues a new access token for a valid refresh token', async () => {
    const token = generateRefreshToken('u1');
    mockRedisClient.get.mockResolvedValue(token);
    mockUser.findById.mockResolvedValue(buildUser());

    const result = await authService.refreshToken(token);

    expect(verifyAccessToken(result.accessToken).userId).toBe('u1');
  });
});

describe('AuthService.logout', () => {
  it('deletes the refresh token and logs the logout', async () => {
    await authService.logout('u1', metadata);

    expect(mockRedisClient.del).toHaveBeenCalledWith('refresh_token:u1');
    expect(mockActivity.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'logout', status: 'success' }),
    );
  });

  it('only logs the logout when Redis is down', async () => {
    mockRcl.isConnected.mockReturnValue(false);

    await authService.logout('u1', metadata);

    expect(mockRedisClient.del).not.toHaveBeenCalled();
    expect(mockActivity.logActivity).toHaveBeenCalled();
  });
});

describe('AuthService helpers', () => {
  it('ApiError.unauthorized defaults message when omitted', () => {
    const e = ApiError.unauthorized();
    expect(e.message).toBe('Authentication required');
  });
});
