import { Request, Response } from "express";
import { MainService } from "../services/api.service";
import { ParseService } from "../services/parse.service";
import { SqliteRepository } from "../repositories/sqlite.repository";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import path from "path";
import fs from "fs";

const MODEL_PATH = path.resolve('./route-model.json');

const service = new MainService(
    new ParseService, new SqliteRepository, new H3Tokenizer
);
export class ApiController {
    async health(_req: Request, res: Response) {
        res.status(200).json({
            status: "ok",
            message: "server is running",
        });
    }

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
    async listModels(req: Request, res: Response) {
        if (req.method === "GET") {
            const raw = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf-8'));
            res.json([{
                id:          raw.version,
                name:        `${raw.type}.json`,
                description: raw.type,
                version:     raw.version,
                uploadedAt:  raw.createdAt,
                status:      'ok' as const}]);
        }
    }

    async getSimilar(req: Request, res: Response) {
        if (req.method === "POST") {
            const files = req.files as {
                model?: Express.Multer.File[];
                database?: Express.Multer.File[];
            };

            if (!files.model?.length) {
                return res.status(400).json({error: "modelFile is required"});
            }

            if (!files.database?.length) {
                return res.status(400).json({error: "databaseFile is required"});
            
            }
            const model = JSON.parse(req.body.model);
            const database = JSON.parse(req.body.database)
            const parsedDB = await service.getRoutes(database)
            const result = await service.getSimilarRoutes(parsedDB,model)
            return res.json(result)
        }
    }

    async train(req: Request, res: Response) {
        if(req.method === "POST") {
            if (!req.file) {
                return res.status(400).json({
                    error: "database file required",
                })
            }
            const parsedDB = await service.getRoutes(req.file.buffer)
            const result = await service.trainModel(parsedDB)
            return res.json(result)
        }
    }
}