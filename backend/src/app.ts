import express from "express";

import parseRoutes from "./routes/api.routes.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import cors from "cors";
import { getEnvVariable } from "./utils/env.helper.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export const app = express();

app.use(express.json());
app.use(loggerMiddleware);
app.use(cors({
    origin: `http://localhost:${getEnvVariable("FRONTEND_PORT")}`,
}))
app.use("/api", parseRoutes);
app.use(errorMiddleware);