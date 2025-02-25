import request from 'supertest';
import express from 'express';
import { transactionRouter } from './transactions';
import { getDb, setupDatabase } from '../database';

const app = express();
app.use(express.json());
app.use('/transactions', transactionRouter);

describe('Transaction Router', () => {
  beforeAll(async () => {
    await setupDatabase();
    const db = getDb();
    await db.run('DELETE FROM sales_events');
    await db.run('DELETE FROM sales_items');
    await db.run('DELETE FROM tax_payments');
  });

  it('should process a sales event', async () => {
    const salesEvent = {
      eventType: 'SALES',
      date: '2023-01-01T00:00:00Z',
      invoiceId: 'inv123',
      items: [
        { itemId: 'item1', cost: 100, taxRate: 0.1 },
        { itemId: 'item2', cost: 200, taxRate: 0.2 },
      ],
    };

    const response = await request(app)
      .post('/transactions')
      .send(salesEvent);

    expect(response.status).toBe(202);
  });

  it('should process a tax payment event', async () => {
    const taxPaymentEvent = {
      eventType: 'TAX_PAYMENT',
      date: '2023-01-01T00:00:00Z',
      amount: 50,
    };

    const response = await request(app)
      .post('/transactions')
      .send(taxPaymentEvent);

    expect(response.status).toBe(202);
  });

  it('should return 400 for an unknown event type', async () => {
    const unknownEvent = {
      eventType: 'UNKNOWN',
      date: '2023-01-01T00:00:00Z',
    };

    const response = await request(app)
      .post('/transactions')
      .send(unknownEvent);

    expect(response.status).toBe(400);
  });
});