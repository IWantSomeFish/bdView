import { SqliteRepository } from "../repositories/sqlite.repository";
import { extractCalibrations } from "../utils/helpers.extractCalibs";
import { runToH3Trajectory } from "../utils/trajectory/trajectory.build";
import { DatasetBuilder } from "./trajectory.datasetBuilder";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import { H3Trajectory, ModelSample, TokenizedTrajectory } from "../utils/trajectory/trajectory.types";
import { ParseService } from "./parse.service";

export class MainService {
        constructor(
            private readonly parser: ParseService = new ParseService,
            private readonly tokenizer: H3Tokenizer = new H3Tokenizer,
            private readonly builder: DatasetBuilder = new DatasetBuilder,
            private readonly repo = new SqliteRepository(),
        ) {}

    async getRoutes(buffer: Buffer): Promise<any[]> {

        const rawDB = await this.repo.dump(buffer);
        const result = await this.parser.parse(rawDB);

        return result
    }

    private async tokenizeRoutes(dataSheets: any[]): Promise<ModelSample[]> {

        const calibrations: H3Trajectory[] = extractCalibrations(dataSheets);
        const trajectories: H3Trajectory[] =  calibrations.map(data => runToH3Trajectory(data)).filter((x): x is H3Trajectory => x !== null);
        const tokenizedTrajectories: TokenizedTrajectory[] = trajectories.map(trajectory => this.tokenizer.tokenizeTrajectory(trajectory));
        const dataSet: ModelSample[] = this.builder.buildBatch(tokenizedTrajectories);

        return dataSet
    }
}
