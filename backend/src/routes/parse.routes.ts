import { Router } from "express";

import { ParseController } from "../controllers/parse.controller.js";

import { uploadDatabase } from "../middlewares/file.middleware.js";

const router = Router();

const controller =
    new ParseController();

router.post(
    "/parse",
    uploadDatabase.single("database"),
    controller.parse.bind(controller),
);

export default router;