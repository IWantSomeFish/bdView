import { Request, Response } from "express";
import { ParseService } from "../services/api.service";
import { trainModel } from "../services/training.service";
import { extractCalibrations } from "../services/model.service";

const service = new ParseService();
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
            const result = await service.parse(req.file.buffer);
            trainModel(extractCalibrations(result))
            if (result instanceof Error) {
                return res.status(400).json({error: `${result}`})
            }
            return res.json(result);
        }
    }
}