import express from "express";
const pinoHttp = require("pino-http");

const app = express();

app.use(pinoHttp());

export default app;
