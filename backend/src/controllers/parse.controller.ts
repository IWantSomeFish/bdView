import { Request, Response } from "express";
import { ParseService } from "../services/parse.service.js";
import { ParseRepository } from "../repositories/parse.repository.js";

const repository = new ParseRepository();
const service = new ParseService(
    repository,
);

export class ParseController {
    async parse(
        req: Request,
        res: Response,
    ): Promise<void> {
        if (!req.file) {
            res.status(400).json({
                error: "Database file missing",
            });

            return;
        }

        const result =
            await service.parseDatabase(
                req.file.buffer,
            );

        res.json(result);
    }
}