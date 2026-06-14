import express from "express";
const pinoHttp = require("pino-http");
import { logger } from "./lib/logger";

const app = express();

app.use(
  pinoHttp({
    logger,
  })
);

export default app;
