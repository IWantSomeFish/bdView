import { Request, Response } from "express";
import { MainService } from "../services/api.service";
import { ParseService } from "../services/parse.service";
import { SqliteRepository } from "../repositories/sqlite.repository";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import { loadModel as loadRouteModel } from "../utils/model/model.inference";
import { serializeModel } from "../utils/model/model.train";
import { loadModel as loadWifiModel } from "../utils/model/wifi.model.inference";
import path from "path";
import fs from "fs";

const MODELS_DIR = path.resolve('./models');
if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });

const ACTIVE_MODEL = path.join(MODELS_DIR, 'active.json');
const ACTIVE_WIFI = path.join(MODELS_DIR, 'wifi-active.json');

let wifiModel = undefined;
try {
    if (fs.existsSync(ACTIVE_WIFI)) {
        wifiModel = loadWifiModel(JSON.parse(fs.readFileSync(ACTIVE_WIFI, 'utf-8')));
    } else if (fs.existsSync(path.resolve('./wifi-model.json'))) {
        const legacy = fs.readFileSync(path.resolve('./wifi-model.json'), 'utf-8');
        fs.writeFileSync(ACTIVE_WIFI, legacy);
        wifiModel = loadWifiModel(JSON.parse(legacy));
    }
} catch {}

const service = new MainService(
    new ParseService, new SqliteRepository, new H3Tokenizer, wifiModel
);

export class ApiController {
    private saveVersionedModel(type: 'route' | 'wifi', json: string): void {
        const parsed = JSON.parse(json);
        const filename = `${type}-${parsed.version}.json`;
        fs.writeFileSync(path.join(MODELS_DIR, filename), json);
        const activeName = type === 'route' ? 'active.json' : 'wifi-active.json';
        fs.writeFileSync(path.join(MODELS_DIR, activeName), json);
    }

    private readActiveModel(type: 'route' | 'wifi'): Record<string, unknown> | null {
        const activePath = type === 'route' ? ACTIVE_MODEL : ACTIVE_WIFI;
        if (!fs.existsSync(activePath)) return null;
        try {
            return JSON.parse(fs.readFileSync(activePath, 'utf-8'));
        } catch {
            return null;
        }
    }

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
            const enriched = service.enrichWithWifiStats(result);
            return res.json(enriched);
        }
    }

    async listModels(req: Request, res: Response) {
        if (req.method !== "GET") return;
        try {
            const files = fs.readdirSync(MODELS_DIR).filter(f => f.endsWith('.json') && !f.startsWith('active'));
            const models = files.map(f => {
                const raw = JSON.parse(fs.readFileSync(path.join(MODELS_DIR, f), 'utf-8'));
                const isWifi = !!raw.payload?.bssidProbability;
                const activeFile = isWifi ? ACTIVE_WIFI : ACTIVE_MODEL;
                let isActive = false;
                try {
                    isActive = fs.readFileSync(activeFile, 'utf-8') === JSON.stringify(raw);
                } catch {}
                return {
                    id: raw.version,
                    filename: f,
                    name: f,
                    description: isWifi ? 'Wi-Fi фильтрация' : raw.type,
                    version: raw.version,
                    uploadedAt: raw.createdAt,
                    metrics: raw.metrics,
                    active: isActive,
                };
            });
            res.json(models);
        } catch {
            res.json([]);
        }
    }

    async getModelById(req: Request, res: Response) {
        const filename = String(req.params.id);
        const filePath = path.join(MODELS_DIR, filename);
        if (!fs.existsSync(filePath) || !filename.endsWith('.json') || filename.startsWith('active')) {
            return res.status(404).json({ error: 'Model not found' });
        }
        try {
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            res.json(raw);
        } catch {
            res.status(500).json({ error: 'Failed to read model' });
        }
    }

    async getSimilar(req: Request, res: Response) {
        if (req.method === "POST") {
            const files = req.files as {
                databaseFile?: Express.Multer.File[];
            };

            if (!files.databaseFile?.length) {
                return res.status(400).json({error: "databaseFile is required"});
            }

            let model: Record<string, unknown>;
            const modelId = req.body.modelId as string | undefined;
            if (modelId) {
                const filePath = path.join(MODELS_DIR, modelId);
                if (!fs.existsSync(filePath) || !modelId.endsWith('.json') || modelId.startsWith('active')) {
                    return res.status(400).json({ error: `Модель ${modelId} не найдена` });
                }
                model = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } else {
                const active = this.readActiveModel('route');
                if (!active) {
                    return res.status(400).json({ error: 'Нет активной модели. Обучите или загрузите модель.' });
                }
                model = active;
            }

            const parsedDB = await service.getRoutes(files.databaseFile[0].buffer)
            const result = await service.getSimilarRoutes(parsedDB, model)
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
            const model = await service.trainModel(parsedDB, {
                minRouteSimiliraty: req.body.minRouteSimiliraty ? Number(req.body.minRouteSimiliraty) : undefined,
                minCosin: req.body.minCosin ? Number(req.body.minCosin) : undefined,
                maxLengthDiffirence: req.body.maxLengthDiffirence ? Number(req.body.maxLengthDiffirence) : undefined,
            })
            this.saveVersionedModel('route', serializeModel(model));
            return res.json({ ok: true, version: model.version, metrics: model.metrics })
        }
    }

    async uploadModel(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ error: 'Нужен файл модели (поле "model")' });
        }
        try {
            const json = req.file.buffer.toString('utf-8');
            const parsed = JSON.parse(json);
            loadRouteModel(parsed);
            this.saveVersionedModel('route', json);
            res.json({ ok: true, version: parsed.version });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Невалидный файл модели';
            res.status(400).json({ error: message });
        }
    }
}
