import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../src/utils/token.js';
import ApiError from '../src/utils/ApiError.js';

describe('token utils', () => {
  const userId = '64f0b2c1a1a1a1a1a1a1a1a1';
  const email = 'user@example.com';
  const role = 'user';

  it('generates a verifiable access token with user payload', () => {
    const token = generateAccessToken(userId, email, role);
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe(userId);
    expect(decoded.email).toBe(email);
    expect(decoded.role).toBe(role);
    expect(decoded.type).toBe('access');
  });

  it('generates a verifiable refresh token with user payload', () => {
    const token = generateRefreshToken(userId);
    const decoded = verifyRefreshToken(token);

    expect(decoded.userId).toBe(userId);
    expect(decoded.type).toBe('refresh');
  });

  it('rejects a refresh token used as an access token and vice versa', () => {
    const refreshToken = generateRefreshToken(userId);

    expect(() => verifyAccessToken(refreshToken)).toThrow(ApiError);
    const accessError = getVerifyError(() => verifyAccessToken(refreshToken));
    expect(accessError.statusCode).toBe(401);

    const accessToken = generateAccessToken(userId, email, role);
    const refreshError = getVerifyError(() => verifyRefreshToken(accessToken));
    expect(refreshError.statusCode).toBe(401);
  });

  it('rejects tampered tokens with unauthorized', () => {
    const token = generateAccessToken(userId, email, role);
    const tampered = `${token.slice(0, -3)}abc`;

    const error = getVerifyError(() => verifyAccessToken(tampered));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
  });
});

const getVerifyError = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return null;
};
