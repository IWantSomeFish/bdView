import { SqliteRepository } from "../repositories/sqlite.repository";
import { extractCalibrations } from "../utils/helpers.extractCalibs";
import { runToH3Trajectory } from "../utils/trajectory/trajectory.build";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import { H3Trajectory, TokenizedTrajectory } from "../utils/trajectory/trajectory.types";
import { ParseService } from "./parse.service";
import { Calibration, Route } from "../types/api.types";
import { createRouteFeatures } from "../utils/model/model.modelTest";
import { saveJSON } from "../utils/helpers.saveJSON";
import { trainRouteSimilarityModel } from "../utils/model/model.train";
import { TrainParams } from "../utils/model/model.types";

export class MainService {
        constructor(
            private readonly parser: ParseService = new ParseService,
            private readonly tokenizer: H3Tokenizer = new H3Tokenizer,
            private readonly repo = new SqliteRepository(),
        ) {}

    /* Функция для получения базы данных в виде древовидной структуры */
    async getRoutes(buffer: Buffer): Promise<Route[]> {

        const rawDB = await this.repo.dump(buffer);
        const result = await this.parser.parse(rawDB);
        return result
    }

    async trainModel (parsedDatabase: Route[]) {
        const H3database: H3Trajectory[] = await this.tokenizeRoutes(parsedDatabase)
        const trainParams: TrainParams = {minRouteSimiliraty: 0.75, minCosin: 0.75, maxLengthDiffirence: 0.8}
        const result = trainRouteSimilarityModel(H3database,trainParams,0.05,160)
        saveJSON(result)
        return
    }
    private async tokenizeRoutes(dataSheets: Route[]): Promise<H3Trajectory[]> {

        const calibrations: Calibration[] = extractCalibrations(dataSheets);
        const trajectories: H3Trajectory[] =  calibrations.map(data => runToH3Trajectory(data)).filter((x): x is H3Trajectory => x !== null);
        return trajectories
    }
}
