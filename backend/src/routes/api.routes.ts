import { Router } from "express";
import { ApiController } from "../controllers/api.controller.js";
import { upload, uploadDatabase } from "../middlewares/upload.middleware.js";

const router = Router();
const controller = new ApiController();

// GET healthcheck
router.get("/health", controller.health.bind(controller));
router.get("/parse", controller.parse.bind(controller));
router.get("/models",controller.listModels.bind(controller))
// POST upload sqlite
router.post(
    "/parse",
    uploadDatabase.single("database"),
    controller.parse.bind(controller),
);

router.post("/similar",
    uploadDatabase.single("database"),
    upload.fields([{ name: "modelFile", maxCount: 1 },{ name: "databaseFile", maxCount: 1 }]),
    controller.getSimilar.bind(controller)
);

router.post("/train",
    uploadDatabase.single("database"),
    controller.train.bind(controller)
)

export default router;