import express from "express";

import parseRoutes from "./routes/api.routes.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";

export const app = express();

app.use(express.json());
app.use(loggerMiddleware);

app.use("/api", parseRoutes);