const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Auth API Endpoints', () => {
  beforeAll(async () => {
    process.env.USE_PG_MEM = 'true';
    await db.resetForTesting();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: 'Jane Doe',
        email: 'jane@example.com'
      });
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject registration if email already exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Clone',
          email: 'jane@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration with invalid email or short password', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'Password123'
        });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: 'valid@example.com',
          password: '123'
        });
      expect(res2.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user with correct password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('jane@example.com');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should reject login for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return profile for authenticated user', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'Password123'
        });

      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('jane@example.com');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
