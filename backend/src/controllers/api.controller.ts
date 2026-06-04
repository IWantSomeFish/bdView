import { Request, Response } from "express";

export class ApiController {
    health(_req: Request, res: Response) {
        res.status(200).json({
            status: "ok",
            message: "server is running",
        });
    }

    async parse(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "database file is required",
            });
        }

        // пока просто подтверждаем что файл пришёл
        return res.status(200).json({
            status: "ok",
            message: "database received",
            meta: {
                filename: req.file.originalname,
                size: req.file.size,
            },
        });
    }
}