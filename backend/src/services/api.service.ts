import { SqliteRepository } from "../repositories/sqlite.repository";
import { extractCalibrations } from "../utils/helpers.extractCalibs";
import { runToH3Trajectory } from "../utils/trajectory/trajectory.build";
import { H3Trajectory } from "../utils/trajectory/trajectory.types";
import { ParseService } from "./parse.service";
import { Calibration, Route } from "../types/api.types";
import { createRouteFeatures } from "../utils/model/model.modelTest";
import { serializeModel, trainRouteSimilarityModel } from "../utils/model/model.train";
import { RouteSimilarityModel, TrainParams } from "../utils/model/model.types";
import { loadModel as loadRouteModel, predictLogistic } from "../utils/model/model.inference";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import { WifiModel, filterStableNetworks } from "../utils/model/wifi.model.inference";
import { trainWifiModel, ScanRow, TrainParams as WifiTrainParams } from "../utils/model/wifi.model.train";

export class MainService {
        constructor(
            private readonly parser: ParseService,
            private readonly repo: SqliteRepository,
            private readonly tokenizer: H3Tokenizer,
            private readonly wifiModel?: WifiModel,
        ) {}

    /* Функция для получения базы данных в виде древовидной структуры */
    async getRoutes(buffer: Buffer): Promise<Route[]> {

        const rawDB = await this.repo.dump(buffer);
        const result = await this.parser.parse(rawDB);
        return result
    }
    async getSimilarRoutes(database: Route[], model: unknown) {
        const H3database: H3Trajectory[] = await this.tokenizeRoutes(database)
        const loadedModel: RouteSimilarityModel = loadRouteModel(model)
        const adjacency = new Map<string, Set<string>>();
        for (let i = 0; i < H3database.length; i++) {
            if (!adjacency.has(H3database[i].runId)) adjacency.set(H3database[i].runId, new Set());
            for (let j = i+1; j < H3database.length; j++) {
                const features: number[] = createRouteFeatures(this.tokenizer.tokenizeTrajectory(H3database[i]), this.tokenizer.tokenizeTrajectory(H3database[j]));
                const prediction = predictLogistic(features, loadedModel.payload.weights)
                if (prediction >= loadedModel.threshold) {
                    adjacency.get(H3database[i].runId)!.add(H3database[j].runId);
                    if (!adjacency.has(H3database[j].runId)) adjacency.set(H3database[j].runId, new Set());
                    adjacency.get(H3database[j].runId)!.add(H3database[i].runId);
                }
            }
        }

        const visited = new Set<string>();
        const groups: Array<{ id: number; routes: Route[] }> = [];
        let groupId = 0;

        for (const [runId, neighbors] of adjacency) {
            if (visited.has(runId)) continue;
            if (neighbors.size === 0) continue;

            const groupRunIds = new Set<string>();
            const queue = [runId];
            while (queue.length > 0) {
                const current = queue.shift()!;
                if (visited.has(current)) continue;
                visited.add(current);
                groupRunIds.add(current);
                for (const neighbor of adjacency.get(current) ?? []) {
                    if (!visited.has(neighbor)) queue.push(neighbor);
                }
            }

            if (groupRunIds.size < 2) continue;

            const groupRoutes: Route[] = [];
            for (const route of database) {
                const routeRunIds = new Set(
                    (route.segments ?? []).flatMap(seg =>
                        (seg.calibrations ?? []).map(cal => cal.runId)
                    )
                );
                if ([...groupRunIds].some(rid => routeRunIds.has(rid))) {
                    groupRoutes.push(route);
                }
            }

            groups.push({ id: groupId++, routes: groupRoutes });
        }

        return groups;
    }
    async trainModel (parsedDatabase: Route[], params?: { minRouteSimiliraty?: number; minCosin?: number; maxLengthDiffirence?: number }) {
        const H3database: H3Trajectory[] = await this.tokenizeRoutes(parsedDatabase)
        const trainParams: TrainParams = {
            minRouteSimiliraty: params?.minRouteSimiliraty ?? 0.55,
            minCosin: params?.minCosin ?? 0.55,
            maxLengthDiffirence: params?.maxLengthDiffirence ?? 0.2,
        }
        const model = trainRouteSimilarityModel(H3database, trainParams, 0.05, 500)
        return model
    }
    private async tokenizeRoutes(dataSheets: Route[]): Promise<H3Trajectory[]> {

        const calibrations: Calibration[] = extractCalibrations(dataSheets);
        const trajectories: H3Trajectory[] =  calibrations.map(data => runToH3Trajectory(data)).filter((x): x is H3Trajectory => x !== null);
        return trajectories
    }

    async getRawScans(buffer: Buffer): Promise<ScanRow[]> {
        const rawDB = await this.repo.dump(buffer);
        const snapshots = (rawDB['raw_calibration_snapshots'] ?? []) as any[];
        const scans: ScanRow[] = [];
        for (const snap of snapshots) {
            if (!snap.wifiNetworksJson) continue;
            let networks: any[];
            try {
                networks = JSON.parse(snap.wifiNetworksJson);
            } catch {
                continue;
            }
            for (const n of networks) {
                const bssid = String(n.bssid ?? '');
                if (!bssid) continue;
                scans.push({
                    bssid,
                    signal: Number(n.signal ?? -100),
                    latitude: Number(snap.gpsLatitude ?? 0),
                    longitude: Number(snap.gpsLongitude ?? 0),
                    runId: String(snap.calibrationRunId ?? ''),
                });
            }
        }
        return scans;
    }

    trainWifiModelFromScans(scans: ScanRow[], params: WifiTrainParams = {}) {
        return trainWifiModel(scans, params);
    }

    getWifiStableNetworks(bssids: string[]): string[] {
        if (!this.wifiModel) return [];
        return filterStableNetworks(bssids, this.wifiModel);
    }

    enrichWithWifiStats(routes: Route[]): Route[] {
        if (!this.wifiModel) return routes;
        for (const route of routes) {
            for (const seg of route.segments ?? []) {
                for (const cal of seg.calibrations ?? []) {
                    const allBssids: string[] = [];
                    for (const snap of cal.snapshots ?? []) {
                        if (!(snap as any).wifiNetworksJson) continue;
                        try {
                            const nets = JSON.parse((snap as any).wifiNetworksJson);
                            for (const n of nets) {
                                if (n.bssid) allBssids.push(String(n.bssid));
                            }
                        } catch {}
                    }
                    if (allBssids.length > 0) {
                        const stable = filterStableNetworks(allBssids, this.wifiModel);
                        cal.stableNetworkCount = stable.length;
                        cal.totalNetworkCount = allBssids.length;
                    }
                }
            }
        }
        return routes;
    }
}
