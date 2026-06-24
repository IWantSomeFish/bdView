import { Request, Response } from "express";
import fs from "fs";
export class ApiController {
    async health(_req: Request, res: Response) {
        res.status(200).json({
            status: "ok",
            message: "server is running",
        });
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
}