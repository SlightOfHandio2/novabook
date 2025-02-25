import express from "express";
import { setupDatabase } from "./database";
import { transactionRouter } from "./routes/transactions";
import { taxPositionRouter } from "./routes/taxPosition";
import { saleRouter } from "./routes/sale";
import { logger } from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware, json parsing
app.use(express.json());

// Middleware, logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
  });
  next();
});

// Routes
app.use("/transactions", transactionRouter);
app.use("/tax-position", taxPositionRouter);
app.use("/sale", saleRouter);

// Middleware, Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Server error", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
  }
);

export { app };

// Initialize database and start server
setupDatabase()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Failed to initialize database", { error: err.message });
    process.exit(1);
  });
