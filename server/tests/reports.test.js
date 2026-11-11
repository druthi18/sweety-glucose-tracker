const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Reports API Endpoints', () => {
  let token;

  beforeAll(async () => {
    process.env.USE_PG_MEM = 'true';
    await db.resetForTesting();

    const authRes = await request(app).post('/api/auth/register').send({
      name: 'Report Test Patient',
      email: 'reportpatient@example.com',
      password: 'Password123'
    });
    token = authRes.body.token;

    // Seed specific known readings for predictable mathematical assertions:
    // Selected date: '2026-10-15'
    // Readings on 2026-10-15:
    // - Morning (fasting): 90
    // - After breakfast: 140
    // - After lunch: 120
    // -> Highest: 140, Lowest: 90, Average: (90+140+120)/3 = 350/3 = 116.666... -> 116.7, Count: 3

    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`).send({
      reading_date: '2026-10-15',
      time_slot: 'Morning (fasting)',
      glucose_value: 90
    });
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`).send({
      reading_date: '2026-10-15',
      time_slot: 'After breakfast',
      glucose_value: 140
    });
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`).send({
      reading_date: '2026-10-15',
      time_slot: 'After lunch',
      glucose_value: 120
    });

    // Earlier in the same month (2026-10-05):
    // - Morning (fasting): 80
    // - After dinner: 160
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`).send({
      reading_date: '2026-10-05',
      time_slot: 'Morning (fasting)',
      glucose_value: 80
    });
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`).send({
      reading_date: '2026-10-05',
      time_slot: 'After dinner',
      glucose_value: 160
    });

    // Previous month (September 2026: 2026-09-12 and 2026-09-28):
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`).send({
      reading_date: '2026-09-12',
      time_slot: 'Morning (fasting)',
      glucose_value: 100
    });
    await request(app).post('/api/readings').set('Authorization', `Bearer ${token}`).send({
      reading_date: '2026-09-28',
      time_slot: 'After dinner',
      glucose_value: 130
    });
  });

  describe('GET /api/reports?date=2026-10-15', () => {
    it('should generate accurate Daily, Month-to-date, and Monthly reports', async () => {
      const res = await request(app)
        .get('/api/reports?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // 1. Daily Report
      const daily = res.body.daily;
      expect(daily.count).toBe(3);
      expect(daily.highest).toBe(140);
      expect(daily.lowest).toBe(90);
      expect(daily.average).toBe(116.7);
      expect(daily.readings).toHaveLength(3);
      expect(daily.readings[0].time_slot).toBe('Morning (fasting)');
      expect(daily.readings[0].glucose_value).toBe(90);

      // 2. Month-to-date Report (1 Oct 2026 - 15 Oct 2026)
      // Readings: 90, 140, 120, 80, 160. Total: 5 readings.
      // Sum = 590, Avg = 590/5 = 118.0
      // Lowest = 80, Highest = 160
      const mtd = res.body.monthToDate;
      expect(mtd.count).toBe(5);
      expect(mtd.highest).toBe(160);
      expect(mtd.lowest).toBe(80);
      expect(mtd.average).toBe(118);

      // 3. Monthly Report (Whole previous month: 1 Sep - 30 Sep 2026)
      // Readings: 100, 130. Total: 2 readings.
      // Highest = 130, Lowest = 100, Avg = 115.0
      const monthly = res.body.monthly;
      expect(monthly.count).toBe(2);
      expect(monthly.highest).toBe(130);
      expect(monthly.lowest).toBe(100);
      expect(monthly.average).toBe(115);
    });

    it('should return empty state (hasData: false, null stats) when no readings exist for date', async () => {
      const res = await request(app)
        .get('/api/reports?date=2025-01-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.daily.count).toBe(0);
      expect(res.body.daily.hasData).toBe(false);
      expect(res.body.daily.highest).toBeNull();
      expect(res.body.daily.lowest).toBeNull();
      expect(res.body.daily.average).toBeNull();
      expect(res.body.daily.readings).toEqual([]);
    });
  });
});
