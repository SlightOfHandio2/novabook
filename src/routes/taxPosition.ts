import express from "express";
import { TaxPosition } from "../types";
import { getDb } from "../database";
import { logger } from "../utils/logger";

export const taxPositionRouter = express.Router();

taxPositionRouter.get("/", async (req, res) => {
  try {
    const date = req.query.date as string;

    if (!date) {
      logger.warn("Missing date parameter");
      return res.status(400).json({ error: "Date parameter is required" });
    }

    if (!isValidISOString(date)) {
      logger.warn("Invalid date format", { date });
      return res
        .status(400)
        .json({ error: "Invalid date format. Use ISO 8601 format." });
    }

    const db = getDb();

    // Calculate total tax from sales up to the specified date
    const salesTaxQuery = `
      WITH sales_with_amendments AS (
        SELECT
          se.invoice_id,
          si.item_id,
          si.cost,
          si.tax_rate,
          se.event_date
        FROM
          sales_events se
        JOIN
          sales_items si ON se.id = si.event_id
        WHERE
          se.event_date <= ?
        
        UNION ALL
        
        SELECT
          sa.invoice_id,
          sa.item_id,
          sa.cost,
          sa.tax_rate,
          sa.amendment_date AS event_date
        FROM
          sales_amendments sa
        WHERE
          sa.amendment_date <= ?
      ),
      latest_item_states AS (
        SELECT
          invoice_id,
          item_id,
          cost,
          tax_rate,
          MAX(event_date) AS latest_date
        FROM
          sales_with_amendments
        GROUP BY
          invoice_id, item_id
      ),
      final_items AS (
        SELECT
          swa.invoice_id,
          swa.item_id,
          swa.cost,
          swa.tax_rate
        FROM
          sales_with_amendments swa
        JOIN
          latest_item_states lis ON swa.invoice_id = lis.invoice_id 
            AND swa.item_id = lis.item_id 
            AND swa.event_date = lis.latest_date
      )
      SELECT
        COALESCE(SUM(cost * tax_rate), 0) AS total_tax
      FROM
        final_items
    `;

    const salesTaxResult = await db.get(salesTaxQuery, date, date);
    const totalSalesTax = salesTaxResult?.total_tax || 0;

    // Calculate total tax payments up to the specified date
    const taxPaymentsQuery = `
      SELECT COALESCE(SUM(amount), 0) AS total_payments
      FROM tax_payments
      WHERE event_date <= ?
    `;

    const taxPaymentsResult = await db.get(taxPaymentsQuery, date);
    const totalTaxPayments = taxPaymentsResult?.total_payments || 0;

    // Calculate the tax position
    const taxPosition = totalSalesTax - totalTaxPayments;

    logger.info("Tax position calculated", {
      date,
      totalSalesTax,
      totalTaxPayments,
      taxPosition,
    });

    const response: TaxPosition = {
      date,
      taxPosition,
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error calculating tax position", { error });
    res.status(500).json({ error: "Failed to calculate tax position" });
  }
});

function isValidISOString(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr === date.toISOString();
  } catch {
    return false;
  }
}
