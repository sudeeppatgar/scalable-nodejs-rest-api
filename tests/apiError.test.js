import ApiError from '../src/utils/ApiError.js';
import { HTTP_STATUS } from '../src/utils/constants.js';

describe('ApiError', () => {
  it('creates an error with statusCode, status and operational flag', () => {
    const error = new ApiError(HTTP_STATUS.BAD_REQUEST, 'Bad request');

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(400);
    expect(error.status).toBe('fail');
    expect(error.isOperational).toBe(true);
    expect(error.data).toBeNull();
  });

  it('marks 5xx errors as status error and non-operational for internal', () => {
    const error = ApiError.internal();

    expect(error.status).toBe('error');
    expect(error.isOperational).toBe(false);
    expect(error.statusCode).toBe(500);
  });

  it.each([
    ['badRequest', HTTP_STATUS.BAD_REQUEST],
    ['unauthorized', HTTP_STATUS.UNAUTHORIZED],
    ['forbidden', HTTP_STATUS.FORBIDDEN],
    ['notFound', HTTP_STATUS.NOT_FOUND],
    ['conflict', HTTP_STATUS.CONFLICT],
    ['unprocessableEntity', HTTP_STATUS.UNPROCESSABLE_ENTITY],
  ])('factory %s returns status %i', (factory, expectedStatus) => {
    const error = ApiError[factory]('oops');

    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(expectedStatus);
    expect(error.message).toBe('oops');
  });

  it('unprocessableEntity carries additional data', () => {
    const errors = [{ field: 'email', message: 'Invalid email' }];
    const error = ApiError.unprocessableEntity('Validation failed', errors);

    expect(error.data).toEqual(errors);
  });
});
