import express from "express";
import { TransactionEvent, SalesEvent, TaxPaymentEvent } from "../types";
import { getDb } from "../database";
import { logger } from "../utils/logger";

export const transactionRouter = express.Router();

transactionRouter.post("/", async (req, res) => {
  try {
    const event: TransactionEvent = req.body;
    const db = getDb();
    const now = new Date().toISOString();

    if (event.eventType === "SALES") {
      const salesEvent = event as SalesEvent;

      // Insert the sales event
      const result = await db.run(
        "INSERT INTO sales_events (event_date, invoice_id, date_received) VALUES (?, ?, ?)",
        salesEvent.date,
        salesEvent.invoiceId,
        now
      );

      const eventId = result.lastID;

      // Insert each item in the sales event
      const insertItemPromises = salesEvent.items.map((item) => {
        return db.run(
          "INSERT INTO sales_items (event_id, item_id, cost, tax_rate) VALUES (?, ?, ?, ?)",
          eventId,
          item.itemId,
          item.cost,
          item.taxRate
        );
      });

      await Promise.all(insertItemPromises);

      logger.info("Sales event processed", {
        invoiceId: salesEvent.invoiceId,
        eventDate: salesEvent.date,
        itemCount: salesEvent.items.length,
      });
    } else if (event.eventType === "TAX_PAYMENT") {
      const taxPayment = event as TaxPaymentEvent;

      // Insert the tax payment
      await db.run(
        "INSERT INTO tax_payments (event_date, amount, date_received) VALUES (?, ?, ?)",
        taxPayment.date,
        taxPayment.amount,
        now
      );

      logger.info("Tax payment processed", {
        amount: taxPayment.amount,
        eventDate: taxPayment.date,
      });
    } else {
      logger.warn("Unknown event type received", {
        eventType: (event as any).eventType,
      });
      return res.status(400).json({ error: "Invalid event type" });
    }

    res.status(202).send();
  } catch (error) {
    logger.error("Error processing transaction", { error });
    res.status(500).json({ error: "Failed to process transaction" });
  }
});
