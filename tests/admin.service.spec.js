import { jest } from '@jest/globals';

const mockUser = {
  find: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  emailExists: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

const mockActivity = {
  logActivity: jest.fn(),
  getUserActivities: jest.fn(),
};

jest.unstable_mockModule('../src/models/user.model.js', () => ({
  __esModule: true,
  default: mockUser,
}));

jest.unstable_mockModule('../src/models/activity.model.js', () => ({
  __esModule: true,
  default: mockActivity,
}));

const { default: adminService } = await import('../src/services/admin.service.js');

const buildFindChain = (result) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

const metadata = { ipAddress: '127.0.0.1', userAgent: 'jest' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AdminService.getAllUsers', () => {
  it('escapes regex special characters in search before querying', async () => {
    const chain = buildFindChain([]);
    mockUser.find.mockReturnValue(chain);
    mockUser.countDocuments.mockResolvedValue(0);

    await adminService.getAllUsers({ page: 1, limit: 10, search: 'a(b*c?d[e]f' });

    const expectedRegex = 'a\\(b\\*c\\?d\\[e\\]f';
    const orClause = mockUser.find.mock.calls[0][0].$or;
    expect(orClause[0].name.$regex).toBe(expectedRegex);
    expect(orClause[1].email.$regex).toBe(expectedRegex);
  });

  it('returns paginated result with derived page count', async () => {
    const users = [{ _id: 'u1', name: 'Alice', email: 'a@x.com', role: 'user', status: 'active' }];
    const chain = buildFindChain(users);
    mockUser.find.mockReturnValue(chain);
    mockUser.countDocuments.mockResolvedValue(25);

    const result = await adminService.getAllUsers({ page: 2, limit: 10 });

    expect(result.users).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 2, limit: 10, total: 25, pages: 3 });
    expect(chain.skip).toHaveBeenCalledWith(10);
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it('does not add $or clause when search is empty', async () => {
    const chain = buildFindChain([]);
    mockUser.find.mockReturnValue(chain);
    mockUser.countDocuments.mockResolvedValue(0);

    await adminService.getAllUsers({ page: 1, limit: 10 });

    expect(mockUser.find.mock.calls[0][0]).toEqual({});
  });

  it('applies role and status filters when provided', async () => {
    const chain = buildFindChain([]);
    mockUser.find.mockReturnValue(chain);
    mockUser.countDocuments.mockResolvedValue(0);

    await adminService.getAllUsers({ role: 'admin', status: 'suspended' });

    expect(mockUser.find.mock.calls[0][0]).toEqual({ role: 'admin', status: 'suspended' });
  });
});

describe('AdminService.getUserById', () => {
  it('returns user details when found', async () => {
    const user = { _id: 'u1', name: 'Alice', email: 'a@x.com', role: 'user', status: 'active', isEmailVerified: true };
    mockUser.findById.mockResolvedValue(user);

    const result = await adminService.getUserById('u1');

    expect(result).toMatchObject({ id: 'u1', name: 'Alice', role: 'user', status: 'active' });
  });

  it('returns 404 when user does not exist', async () => {
    mockUser.findById.mockResolvedValue(null);

    await expect(adminService.getUserById('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('AdminService.updateUser', () => {
  it('blocks admins from changing their own role', async () => {
    mockUser.findById.mockResolvedValue({ _id: 'me', name: 'Admin', email: 'admin@x.com', role: 'admin', save: jest.fn() });

    await expect(adminService.updateUser('me', { role: 'user' }, 'me', metadata))
      .rejects.toMatchObject({ statusCode: 400 });

    expect(mockActivity.logActivity).not.toHaveBeenCalled();
  });

  it('blocks admins from suspending their own account', async () => {
    mockUser.findById.mockResolvedValue({ _id: 'me', name: 'Admin', email: 'admin@x.com', role: 'admin', status: 'active', save: jest.fn() });

    await expect(adminService.updateUser('me', { status: 'suspended' }, 'me', metadata))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns 404 when target user does not exist', async () => {
    mockUser.findById.mockResolvedValue(null);

    await expect(adminService.updateUser('ghost', { name: 'X' }, 'me', metadata))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 409 when target email is taken', async () => {
    mockUser.findById.mockResolvedValue({ _id: 'u1', name: 'Alice', email: 'a@x.com' });
    mockUser.emailExists.mockResolvedValue(true);

    await expect(adminService.updateUser('u1', { email: 'taken@x.com' }, 'me', metadata))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('updates allowed fields and logs admin_action', async () => {
    const user = { _id: 'u1', name: 'Alice', email: 'a@x.com', role: 'user', status: 'active', isEmailVerified: false, save: jest.fn().mockResolvedValue(undefined) };
    mockUser.findById.mockResolvedValue(user);
    mockUser.emailExists.mockResolvedValue(false);

    const result = await adminService.updateUser('u1', { name: 'Alice Admin', status: 'inactive' }, 'me', metadata);

    expect(user.name).toBe('Alice Admin');
    expect(user.status).toBe('inactive');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: 'u1', name: 'Alice Admin', status: 'inactive' });
    expect(mockActivity.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin_action', metadata: expect.objectContaining({ targetUserId: 'u1' }) }),
    );
  });
});

describe('AdminService.deleteUser', () => {
  it('blocks self-deletion', async () => {
    await expect(adminService.deleteUser('me', 'me', metadata))
      .rejects.toMatchObject({ statusCode: 400 });

    expect(mockUser.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('returns 404 when target user does not exist', async () => {
    mockUser.findById.mockResolvedValue(null);

    await expect(adminService.deleteUser('ghost', 'me', metadata))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('deletes user and logs admin_action with deleted email', async () => {
    mockUser.findById.mockResolvedValue({ _id: 'u1', email: 'victim@x.com' });
    mockUser.findByIdAndDelete.mockResolvedValue(undefined);

    await adminService.deleteUser('u1', 'me', metadata);

    expect(mockUser.findByIdAndDelete).toHaveBeenCalledWith('u1');
    expect(mockActivity.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin_action',
        metadata: expect.objectContaining({ targetUserId: 'u1', deletedUserEmail: 'victim@x.com' }),
      }),
    );
  });
});

describe('AdminService.getUserActivities', () => {
  it('queries activity log with pagination options', async () => {
    const activities = [{ action: 'login', description: 'x' }];
    mockActivity.getUserActivities.mockResolvedValue(activities);

    const result = await adminService.getUserActivities('u1', { limit: 20, skip: 5 });

    expect(result).toEqual(activities);
    expect(mockActivity.getUserActivities).toHaveBeenCalledWith('u1', { limit: 20, skip: 5 });
  });
});
