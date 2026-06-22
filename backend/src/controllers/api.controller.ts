import { Request, Response } from "express";
import { MainService } from "../services/api.service";
import { ParseService } from "../services/parse.service";
import { SqliteRepository } from "../repositories/sqlite.repository";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import path from "path";
import fs from "fs";


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
    async listModels(_req: Request, res: Response) {
        try {
            const files = fs.readdirSync('.').filter(f => f.startsWith('route-model-') && f.endsWith('.json'));
            const models = files.map(file => {
                const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
                return {
                    id:          raw.version,
                    name:        file,
                    description: raw.type ?? 'route-similarity',
                    version:     raw.version,
                    uploadedAt:  raw.createdAt,
                    status:      'ok' as const,
                };
            });
            res.json(models);
        } catch {
            res.json([]);
        }
    }

    async getSimilar(req: Request, res: Response) {
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
            const parsedDB = await service.getRoutes(files.databaseFile[0].buffer);
            const result = await service.getSimilarRoutes(parsedDB, model);
            return res.json(result);
        }
    }

    async uploadModel(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ error: 'Нужен файл модели (поле "model")' });
        }
        try {
            const json = req.file.buffer.toString('utf-8');
            const parsed = JSON.parse(json);
            if (!parsed?.payload?.weights) {
                return res.status(400).json({ error: 'Невалидный файл модели: отсутствуют weights' });
            }
            const version = parsed.version ?? Date.now();
            fs.writeFileSync(`route-model-${version}.json`, json);
            res.json({ ok: true, version });
        } catch {
            res.status(400).json({ error: 'Невалидный JSON' });
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