import { Router } from "express";
import { ApiController } from "../controllers/api.controller.js";
import { upload, uploadDatabase } from "../middlewares/upload.middleware.js";
import { RouteControlller } from "../controllers/route.controller.js";

const router = Router();
const mainController = new ApiController();
const routeController = new RouteControlller()

// Main controller endpoints
router.get("/health", mainController.health.bind(mainController));
router.get("/models",mainController.listModels.bind(mainController))
router.post("/models/upload",
    upload.single("model"),
    mainController.uploadModel.bind(mainController)
)

// Route controller endpoints
router.get("/route/parse", routeController.parse.bind(mainController));
router.post(
    "/route/parse",
    uploadDatabase.single("database"),
    routeController.parse.bind(mainController),
);

router.post("/route/similar",
    upload.fields([{ name: "modelFile", maxCount: 1 },{ name: "databaseFile", maxCount: 1 }]),
    routeController.getSimilar.bind(mainController)
);

router.post("/route/train",
    uploadDatabase.single("database"),
    routeController.train.bind(mainController)
)

export default router;