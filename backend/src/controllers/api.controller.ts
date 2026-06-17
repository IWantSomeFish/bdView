import { Request, Response } from "express";
import { mainService } from "../services/api.service";

const service = new mainService();
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
<<<<<<< HEAD
            const result = await service.getRoutes(req.file.buffer);
||||||| 334d398
            const result = await service.parse(req.file.buffer);
            trainModel(extractCalibrations(result))
            if (result instanceof Error) {
                return res.status(400).json({error: `${result}`})
            }
=======
            const result = await service.getRoutes(req.file.buffer);
            return res.json(result);
        }
    }

    async getSimilar(req: Request, res: Response) {
        if (req.method === "POST") {
            if (!req.file) {
                return res.status(400).json({
                    error: "database file required",
                })
            }
            const parsedDB = await service.getRoutes(req.file.buffer);
            const result = await service.getSimilar(parsedDB,req.file.buffer);
>>>>>>> origin/master
            return res.json(result);
        }
    }
}