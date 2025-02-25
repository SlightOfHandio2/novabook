import request from "supertest";
import express from "express";
import { saleRouter } from "./sale";
import { getDb, setupDatabase } from "../database";

const app = express();
app.use(express.json());
app.use("/sale", saleRouter);

describe("Sale Router", () => {
  beforeAll(async () => {
    await setupDatabase();
    const db = getDb();
    await db.run("DELETE FROM sales_amendments");
  });

  it("should process a sale amendment", async () => {
    const amendment = {
      date: "2023-01-01T00:00:00Z",
      invoiceId: "inv123",
      itemId: "item1",
      cost: 150,
      taxRate: 0.15,
    };

    const response = await request(app).patch("/sale").send(amendment);

    expect(response.status).toBe(202);
  });
  
  it("should return 400 for invalid amendment data", async () => {
    const invalidAmendment = {
      date: "2023-01-01T00:00:00Z",
      invoiceId: "inv123",
      // Missing itemId, cost, and taxRate
    };

    const response = await request(app).patch("/sale").send(invalidAmendment);

    expect(response.status).toBe(400);
  });
});
