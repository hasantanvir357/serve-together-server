import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../routes/middleware/authMiddleware.js';

const JWT_SECRET = 'middleware-test-secret';

function createResponse() {
  return {
    statusCode: 200,
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
}

function createRequest(authorization) {
  return {
    get(name) {
      return name.toLowerCase() === 'authorization' ? authorization : undefined;
    },
  };
}

test.before(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

test('rejects requests without a Bearer token', () => {
  const response = createResponse();
  let nextCalled = false;

  verifyToken(createRequest(undefined), response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('rejects non-Bearer authorization schemes', () => {
  const response = createResponse();
  let nextCalled = false;

  verifyToken(createRequest('Basic credentials'), response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('rejects invalid Bearer tokens', () => {
  const response = createResponse();
  let nextCalled = false;

  verifyToken(createRequest('Bearer invalid-token'), response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('accepts a valid Bearer token and normalizes its email', () => {
  const token = jwt.sign({ email: 'USER@EXAMPLE.COM' }, JWT_SECRET);
  const request = createRequest(`Bearer ${token}`);
  const response = createResponse();
  let nextCalled = false;

  verifyToken(request, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(request.user.email, 'user@example.com');
});
