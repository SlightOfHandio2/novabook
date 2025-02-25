import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { logger } from "./utils/logger";

let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function setupDatabase(): Promise<void> {
  try {
    //open local db file
    db = await open({
      filename: "./tax_service.db",
      driver: sqlite3.Database,
    });

    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sales_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_date TEXT NOT NULL,
        invoice_id TEXT NOT NULL,
        date_received TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        item_id TEXT NOT NULL,
        cost INTEGER NOT NULL,
        tax_rate REAL NOT NULL,
        FOREIGN KEY (event_id) REFERENCES sales_events(id)
      );

      CREATE TABLE IF NOT EXISTS tax_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_date TEXT NOT NULL,
        amount INTEGER NOT NULL,
        date_received TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales_amendments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amendment_date TEXT NOT NULL,
        invoice_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        cost INTEGER NOT NULL,
        tax_rate REAL NOT NULL,
        date_received TEXT NOT NULL
      );
    `);

    logger.info("Database initialized successfully");
  } catch (error) {
    logger.error("Database initialization failed", { error });
    throw error;
  }
}

export function getDb(): Database<sqlite3.Database, sqlite3.Statement> {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
