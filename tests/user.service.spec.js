import { jest } from '@jest/globals';

const mockUser = {
  findById: jest.fn(),
  emailExists: jest.fn(),
};

const mockActivity = {
  logActivity: jest.fn(),
};

const mockRcl = {
  isConnected: jest.fn(),
  getClient: jest.fn(),
};

const mockRedisClient = {
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

const { default: userService } = await import('../src/services/user.service.js');

const buildUser = (overrides = {}) => ({
  _id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'user',
  status: 'active',
  isEmailVerified: false,
  lastLogin: new Date('2024-01-01T00:00:00Z'),
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  password: 'hashed-current',
  comparePassword: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const metadata = { ipAddress: '127.0.0.1', userAgent: 'jest' };

beforeEach(() => {
  jest.clearAllMocks();
  mockRcl.isConnected.mockReturnValue(true);
  mockRcl.getClient.mockReturnValue(mockRedisClient);
});

describe('UserService.getProfile', () => {
  it('returns profile fields when user exists', async () => {
    const user = buildUser();
    mockUser.findById.mockResolvedValue(user);

    const profile = await userService.getProfile('u1');

    expect(profile).toMatchObject({ id: 'u1', name: 'Alice', email: 'alice@example.com', lastLogin: user.lastLogin });
  });

  it('returns 404 when user does not exist', async () => {
    mockUser.findById.mockResolvedValue(null);

    await expect(userService.getProfile('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('UserService.updateProfile', () => {
  it('returns 404 when user does not exist', async () => {
    mockUser.findById.mockResolvedValue(null);

    await expect(userService.updateProfile('ghost', { name: 'X' }, metadata))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 409 when new email is already taken', async () => {
    mockUser.findById.mockResolvedValue(buildUser());
    mockUser.emailExists.mockResolvedValue(true);

    await expect(userService.updateProfile('u1', { email: 'taken@x.com' }, metadata))
      .rejects.toMatchObject({ statusCode: 409 });

    expect(mockActivity.logActivity).not.toHaveBeenCalled();
  });

  it('changes name and logs update_profile activity', async () => {
    const user = buildUser();
    mockUser.findById.mockResolvedValue(user);
    mockUser.emailExists.mockResolvedValue(false);

    const result = await userService.updateProfile('u1', { name: 'Alice 2' }, metadata);

    expect(user.name).toBe('Alice 2');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('Alice 2');
    expect(mockActivity.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update_profile', status: 'success' }),
    );
  });

  it('ignores email change to the same value without conflict check', async () => {
    const user = buildUser();
    mockUser.findById.mockResolvedValue(user);

    await userService.updateProfile('u1', { email: 'alice@example.com' }, metadata);

    expect(mockUser.emailExists).not.toHaveBeenCalled();
    expect(user.email).toBe('alice@example.com');
  });
});

describe('UserService.changePassword', () => {
  it('returns 404 when user does not exist', async () => {
    mockUser.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await expect(userService.changePassword('ghost', 'Aa123456', 'Bb123456', metadata))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 401 when current password is wrong', async () => {
    const user = buildUser({ comparePassword: jest.fn().mockResolvedValue(false) });
    mockUser.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    await expect(userService.changePassword('u1', 'wrong', 'Bb123456', metadata))
      .rejects.toMatchObject({ statusCode: 401 });

    expect(user.save).not.toHaveBeenCalled();
  });

  it('saves new password, revokes refresh token and logs activity', async () => {
    const user = buildUser();
    mockUser.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    await userService.changePassword('u1', 'current', 'NewPass123', metadata);

    expect(user.password).toBe('NewPass123');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(mockRedisClient.del).toHaveBeenCalledWith('refresh_token:u1');
    expect(mockActivity.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'change_password', status: 'success' }),
    );
  });
});
