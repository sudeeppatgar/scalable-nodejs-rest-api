import { jest } from '@jest/globals';

const mockUser = {
  find: jest.fn(),
  countDocuments: jest.fn(),
};

jest.unstable_mockModule('../src/models/user.model.js', () => ({
  __esModule: true,
  default: mockUser,
}));

const { default: adminService } = await import('../src/services/admin.service.js');

const buildFindChain = (result) => {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
  };
  return chain;
};

describe('AdminService.getAllUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
});
