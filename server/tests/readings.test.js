const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Readings API & Validation Rules', () => {
  let tokenUserA;
  let tokenUserB;
  const todayStr = new Date().toISOString().slice(0, 10);

  beforeAll(async () => {
    process.env.USE_PG_MEM = 'true';
    await db.resetForTesting();

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'usera@example.com',
      password: 'Password123'
    });
    tokenUserA = resA.body.token;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'Password123'
    });
    tokenUserB = resB.body.token;
  });

  describe('Validation Rules when adding a reading', () => {
    it('Rule: Value is required -> "Please enter a glucose value."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: todayStr,
          time_slot: 'Morning (fasting)',
          glucose_value: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Please enter a glucose value.');
    });

    it('Rule: Value must be a whole number between 40 and 600 -> "Value must be between 40 and 600 mg/dl."', async () => {
      // Test below 40
      const resLow = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: todayStr,
          time_slot: 'Morning (fasting)',
          glucose_value: 39
        });
      expect(resLow.status).toBe(400);
      expect(resLow.body.message).toBe('Value must be between 40 and 600 mg/dl.');

      // Test above 600
      const resHigh = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: todayStr,
          time_slot: 'Morning (fasting)',
          glucose_value: 601
        });
      expect(resHigh.status).toBe(400);
      expect(resHigh.body.message).toBe('Value must be between 40 and 600 mg/dl.');

      // Test non-integer decimal
      const resDecimal = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: todayStr,
          time_slot: 'Morning (fasting)',
          glucose_value: 120.5
        });
      expect(resDecimal.status).toBe(400);
      expect(resDecimal.body.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('Rule: Date cannot be in the future -> "Date cannot be in the future."', async () => {
      const futureDate = '2099-12-31';
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: futureDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 100
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Date cannot be in the future.');
    });

    it('should successfully add valid reading', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: todayStr,
          time_slot: 'Morning (fasting)',
          glucose_value: 95
        });

      expect(res.status).toBe(201);
      expect(res.body.reading.glucose_value).toBe(95);
      expect(res.body.reading.time_slot).toBe('Morning (fasting)');
    });

    it('Rule: Only one reading per slot per day -> "You already have an [Slot Name] reading for this date."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: todayStr,
          time_slot: 'Morning (fasting)',
          glucose_value: 105
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('You already have an Morning (fasting) reading for this date.');
    });

    it('Rule: Maximum 4 readings per day -> "You can add only 4 readings per day."', async () => {
      // Add 2nd, 3rd, 4th slot
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: todayStr,
          time_slot: 'After breakfast',
          glucose_value: 135
        });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: todayStr,
          time_slot: 'After lunch',
          glucose_value: 140
        });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: todayStr,
          time_slot: 'After dinner',
          glucose_value: 150
        });

      // Now User A has 4 readings for today. Attempting to add a 5th should fail with max readings error.
      const res5th = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: todayStr,
          time_slot: 'Morning (fasting)', // Even with another slot or duplicate
          glucose_value: 110
        });

      expect(res5th.status).toBe(400);
      expect(res5th.body.message).toBe('You can add only 4 readings per day.');
    });
  });

  describe('User Isolation and CRUD operations', () => {
    it('User B only sees their own readings, not User A readings', async () => {
      // User B checks readings
      const resB = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.readings.length).toBe(0);

      // User A checks readings
      const resA = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.readings.length).toBe(4);
    });

    it('should allow editing a reading', async () => {
      const listA = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`);

      const readingToEdit = listA.body.readings[0];

      const resEdit = await request(app)
        .put(`/api/readings/${readingToEdit.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          reading_date: readingToEdit.reading_date,
          time_slot: readingToEdit.time_slot,
          glucose_value: 102
        });

      expect(resEdit.status).toBe(200);
      expect(resEdit.body.reading.glucose_value).toBe(102);
    });

    it('User B cannot edit or delete User A reading', async () => {
      const listA = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`);

      const readingA = listA.body.readings[0];

      // User B tries to update User A's reading
      const updateRes = await request(app)
        .put(`/api/readings/${readingA.id}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          reading_date: readingA.reading_date,
          time_slot: readingA.time_slot,
          glucose_value: 120
        });
      expect(updateRes.status).toBe(404);

      // User B tries to delete User A's reading
      const deleteRes = await request(app)
        .delete(`/api/readings/${readingA.id}`)
        .set('Authorization', `Bearer ${tokenUserB}`);
      expect(deleteRes.status).toBe(404);
    });

    it('should allow deleting a reading', async () => {
      const listA = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`);

      const readingToDelete = listA.body.readings[0];

      const delRes = await request(app)
        .delete(`/api/readings/${readingToDelete.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(delRes.status).toBe(200);

      // Verify deletion
      const checkRes = await request(app)
        .get(`/api/readings/${readingToDelete.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(checkRes.status).toBe(404);
    });

    it('should support pagination bonus feature on GET /readings (?page=1&limit=2)', async () => {
      const res = await request(app)
        .get('/api/readings?page=1&limit=2')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.readings.length).toBeLessThanOrEqual(2);
    });
  });
});
