import request from 'supertest';
import express from 'express';
import { taxPositionRouter } from './taxPosition';
import { getDb, setupDatabase } from '../database';

const app = express();
app.use(express.json());
app.use('/tax-position', taxPositionRouter);

describe('Tax Position Router', () => {
  beforeAll(async () => {
    await setupDatabase();
    const db = getDb();
    await db.run('DELETE FROM sales_events');
    await db.run('DELETE FROM sales_items');
    await db.run('DELETE FROM tax_payments');
    await db.run('DELETE FROM sales_amendments');

    // Insert test data
    await db.run(
      'INSERT INTO sales_events (event_date, invoice_id, date_received) VALUES (?, ?, ?)',
      '2023-01-01T00:00:00Z',
      'inv123',
      '2023-01-01T00:00:00Z'
    );
    await db.run(
      'INSERT INTO sales_items (event_id, item_id, cost, tax_rate) VALUES (?, ?, ?, ?)',
      1,
      'item1',
      100,
      0.1
    );
    await db.run(
      'INSERT INTO tax_payments (event_date, amount, date_received) VALUES (?, ?, ?)',
      '2023-01-01T00:00:00Z',
      5,
      '2023-01-01T00:00:00Z'
    );
  });

  it('should calculate the tax position', async () => {
    const response = await request(app)
      .get('/tax-position?date=2025-02-25T16:15:17.102Z');
    
    expect(response.status).toBe(200);
    expect(response.body.taxPosition).toBeDefined();
  });

  it('should return 400 for missing date parameter', async () => {
    const response = await request(app)
      .get('/tax-position');

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid date format', async () => {
    const response = await request(app)
      .get('/tax-position?date=invalid-date');

    expect(response.status).toBe(400);
  });
});