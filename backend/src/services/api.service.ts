import { SqliteRepository } from "../repositories/sqlite.repository";
import { extractCalibrations } from "../utils/helpers.extractCalibs";
import { runToH3Trajectory } from "../utils/trajectory/trajectory.build";
import { H3Trajectory } from "../utils/trajectory/trajectory.types";
import { ParseService } from "./parse.service";
import { Calibration, Route } from "../types/api.types";
import { createRouteFeatures } from "../utils/model/model.modelTest";
import { saveJSON } from "../utils/helpers.saveJSON";
import { serializeModel, trainRouteSimilarityModel } from "../utils/model/model.train";
import { RouteSimilarityModel, TrainParams } from "../utils/model/model.types";
import { loadModel, predictLogistic } from "../utils/model/model.inference";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";

export class MainService {
    constructor(
        private readonly parser: ParseService,
        private readonly repo: SqliteRepository,
        private readonly tokenizer: H3Tokenizer,
    ) { }

    /* Функция для получения базы данных в виде древовидной структуры */
    async getRoutes(buffer: Buffer): Promise<Route[]> {

        const rawDB = await this.repo.dump(buffer);
        const result = await this.parser.parse(rawDB);
        return result
    }
    async getSimilarRoutes(database: Route[], model: unknown) {
        const H3database: H3Trajectory[] = await this.tokenizeRoutes(database)
        const loadedModel: RouteSimilarityModel = loadModel(model)
        const result = new Map<string, string[]>();
        for (let i = 0; i < H3database.length - 1; i++) {
            for (let j = i + 1; j < H3database.length - 1; j++) {
                const features: number[] = createRouteFeatures(this.tokenizer.tokenizeTrajectory(H3database[i]), this.tokenizer.tokenizeTrajectory(H3database[j]));
                const prediction = predictLogistic(features, loadedModel.payload.weights)
                if (result.has(H3database[j].runId)) {
                    if (prediction >= loadedModel.threshold) {
                        result.get(H3database[j].runId)?.push(H3database[i].runId)
                    }
                }
                else {
                    result.set(H3database[j].runId, [])
                }
            }
        }
        return Object.fromEntries(result)
    }
    async trainModel(parsedDatabase: Route[]) {
        const H3database: H3Trajectory[] = await this.tokenizeRoutes(parsedDatabase)
        const trainParams: TrainParams = { minRouteSimiliraty: 0.55, minCosin: 0.55, maxLengthDiffirence: 0.2 }
        // HyperParametrs
        const model = trainRouteSimilarityModel(H3database, trainParams, 0.05, 200)
        const result = serializeModel(model)
        saveJSON(JSON.parse(result))
        return result
    }
    private async tokenizeRoutes(dataSheets: Route[]): Promise<H3Trajectory[]> {

        const calibrations: Calibration[] = extractCalibrations(dataSheets);
        const trajectories: H3Trajectory[] = calibrations.map(data => runToH3Trajectory(data)).filter((x): x is H3Trajectory => x !== null);
        return trajectories
    }
}
