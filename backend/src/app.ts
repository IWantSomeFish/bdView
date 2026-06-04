import express from "express";

import parseRoutes from "./routes/parse.routes.js";

export const app = express();

app.use(express.json());

app.use("/api", parseRoutes);