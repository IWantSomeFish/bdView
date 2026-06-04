import { Router } from "express";

import { ParseController } from "../controllers/api.controller.js";

import { uploadDatabase } from "../middlewares/api.middleware.js";

const router = Router();

const controller =
    new ParseController();

router.post(
    "/parse",
    uploadDatabase.single("database"),
    controller.parse.bind(controller),
);

export default router;