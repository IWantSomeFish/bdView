import { WifiModel, filterStableNetworks } from "../models/wifiModel/model.inference";
import { ScanRow, trainWifiModel, WifiTrainParams } from "../models/wifiModel/model.train";
import { SqliteRepository } from "../repositories/sqlite.repository";
import { REQUIRED_TABLES } from "../types/api.types";
import { modelAPI } from "./modelAPI.types";

export class WifiService implements modelAPI {
    constructor(
        private readonly repo: SqliteRepository,
    ) { }

    async parse(raw: any): Promise<ScanRow[]> {
        const tables: Record<string, unknown> = {};

        for (const table of REQUIRED_TABLES) {
            tables[table] = raw[table] ?? [];
        }
        const calibrations = tables.calibration_runs as any[];
        const result: ScanRow[] = calibrations.map(x => ({
            bssid: x.bssid,
            signal: x.signal,
            latitude: x.latitude,
            longitude: x.longitude,
            runId: x.runId,
        
        }));
        return result
    }

    async get (buffer: Buffer): Promise<ScanRow[]> {
        const rawDB = await this.repo.dump(buffer)
        const result = await this.parse(rawDB)
        return result
    }

    loadModel(raw: unknown): WifiModel {
        const m = raw as WifiModel;
        if (!m?.payload?.weights || !m?.payload?.bssidProbability) {
            throw new Error('Невалидный файл модели: отсутствуют weights или bssidProbability');
        }
        return m;
    }
    async inference(database: ScanRow[], model: unknown) {
        const lodaedModel: WifiModel = this.loadModel(model)
        const result = filterStableNetworks(database.map(x => x.bssid), lodaedModel)
        return result
    }

    async train(database: ScanRow[],params: WifiTrainParams): Promise<WifiModel> {
        const result = trainWifiModel(database,params)
        return result
    }
}