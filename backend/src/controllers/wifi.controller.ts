import { Request, Response } from "express";
import { saveJSON } from "../utils/helpers.saveJSON";
import { TrainParams } from "../models/routeModel/model.types";
import { parseTrainingConfig } from "../utils/configValidation.helper";
import { service } from "./api.controller";

export class wifiController {

     async parse(req: Request, res: Response) {
            if (req.method === "GET") {
                return res.status(400).json({
                    error: "GET request is not supported, use POST with multipart/form-data and a file field named 'database'",
                });
            }
            if (req.method === "POST") {
                if (!req.file) {
                    return res.status(400).json({
                        error: "database file required",
                    });
                }
                const result = await service.getRoutes(req.file.buffer);
                return res.json(result);
            }
        }

}