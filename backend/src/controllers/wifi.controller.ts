import { Request, Response } from "express";
import { WifiService } from "../services/api.wifi";
import { SqliteRepository } from "../repositories/sqlite.repository";

const service = new WifiService(new SqliteRepository,);
export class WifiController {

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
            return res.json(result);
        }
    }
}