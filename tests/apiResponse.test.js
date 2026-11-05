import ApiResponse from '../src/utils/ApiResponse.js';

describe('ApiResponse', () => {
  const buildRes = () => {
    const res = {
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
    };
    return res;
  };

  it('ok() sends a 200 payload with success, message, data and timestamp', () => {
    const res = buildRes();
    const data = { id: 1 };

    ApiResponse.ok('Profile retrieved successfully', data).send(res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Profile retrieved successfully');
    expect(res.body.data).toEqual(data);
    expect(res.body.timestamp).toEqual(expect.any(String));
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('created() sends a 201 payload', () => {
    const res = buildRes();

    ApiResponse.created('Registration successful', { id: 1 }).send(res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('success() allows custom status codes', () => {
    const res = buildRes();

    ApiResponse.success(503, 'Health check completed', { status: 'degraded' }).send(res);

    expect(res.statusCode).toBe(503);
  });

  it('defaults data to null when omitted', () => {
    const res = buildRes();

    ApiResponse.ok('Password changed successfully').send(res);

    expect(res.body.data).toBeNull();
  });
});
