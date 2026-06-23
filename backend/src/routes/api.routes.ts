import { Router } from "express";
import { ApiController } from "../controllers/api.controller.js";
import { uploadDatabase } from "../middlewares/upload.middleware.js";
import multer from "multer";

const router = Router();
const controller = new ApiController();
const uploadModel = multer({ storage: multer.memoryStorage() });

// GET healthcheck
router.get("/health", controller.health.bind(controller));
router.get("/parse", controller.parse.bind(controller));
router.get("/models", controller.listModels.bind(controller));
router.get("/models/:id", controller.getModelById.bind(controller));
// POST upload sqlite
router.post(
    "/parse",
    uploadDatabase.single("database"),
    controller.parse.bind(controller),
);

router.post("/similar",
    multer({ storage: multer.memoryStorage() }).single("databaseFile"),
    controller.getSimilar.bind(controller)
);

router.post("/train",
    uploadDatabase.single("database"),
    controller.train.bind(controller)
);

router.post("/models/upload",
    uploadModel.single("model"),
    controller.uploadModel.bind(controller)
);

router.post("/models/train",
    uploadDatabase.single("database"),
    controller.train.bind(controller)
);

export default router;