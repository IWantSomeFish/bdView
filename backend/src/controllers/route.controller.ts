import { Request, Response } from "express";
import { saveJSON } from "../utils/helpers.saveJSON";
import { TrainParams } from "../models/routeModel/model.types";
import { parseTrainingConfig } from "../utils/configValidation.helper";
import { RouteSerivce } from "../services/api.route";
import { SqliteRepository } from "../repositories/sqlite.repository";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";

const service = new RouteSerivce(
    new SqliteRepository, new H3Tokenizer
);
export class RouteControlller {

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
                const result = await service.get(req.file.buffer);
                return res.json(result);
            }
        }
    
    async inference(req: Request, res: Response) {
        if (req.method === "POST") {
            const files = req.files as {
                modelFile?: Express.Multer.File[];
                databaseFile?: Express.Multer.File[];
            };

            if (!files.modelFile?.length) {
                return res.status(400).json({error: "modelFile is required"});
            }

            if (!files.databaseFile?.length) {
                return res.status(400).json({error: "databaseFile is required"});
            }

            const model = JSON.parse(files.modelFile[0].buffer.toString('utf-8'));
            const parsedDB = await service.get(files.databaseFile[0].buffer);
            const result = await service.inference(parsedDB, model);
            saveJSON(result)
            return res.json(result);
        }
    }
    async train(req: Request, res: Response) {
        if(req.method === "POST") {
            if (!req.file) {
                return res.status(400).json({
                    error: "database file required",
                })
            }
            const trainingConfig: TrainParams = parseTrainingConfig(req.body.config)
            const parsedDB = await service.get(req.file.buffer)
            const result = await service.train(parsedDB,trainingConfig)
            return res.json(result)
        }
    }
}