import express from "express";
import { SaleAmendment } from "../types";
import { getDb } from "../database";
import { logger } from "../utils/logger";

export const saleRouter = express.Router();

saleRouter.patch("/", async (req, res) => {
  try {
    const amendment: SaleAmendment = req.body;
    const db = getDb();
    const now = new Date().toISOString();

    // Validate the amendment, 400 if invalid
    if (
      !amendment.date ||
      !amendment.invoiceId ||
      !amendment.itemId ||
      amendment.cost === undefined ||
      amendment.taxRate === undefined
    ) {
      logger.warn("Invalid amendment request", { amendment });
      return res.status(400).json({ error: "Invalid amendment data" });
    }

    // Insert the amendment
    await db.run(
      "INSERT INTO sales_amendments (amendment_date, invoice_id, item_id, cost, tax_rate, date_received) VALUES (?, ?, ?, ?, ?, ?)",
      amendment.date,
      amendment.invoiceId,
      amendment.itemId,
      amendment.cost,
      amendment.taxRate,
      now
    );

    logger.info("Sale amendment processed", {
      invoiceId: amendment.invoiceId,
      itemId: amendment.itemId,
      amendmentDate: amendment.date,
    });

    res.status(202).send();
  } catch (error) {
    logger.error("Error processing sale amendment", { error });
    res.status(500).json({ error: "Failed to process sale amendment" });
  }
});
