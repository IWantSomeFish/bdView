import { SqliteRepository } from "../repositories/sqlite.repository";
import { extractCalibrations } from "../utils/helpers.extractCalibs";
import { saveJSON } from "../utils/helpers.saveJSON";
import { ConnectedComponentsService } from "../utils/model/model.components";
import { SimilarityGraphBuilder } from "../utils/model/model.graphBuilder";
import { runToH3Trajectory } from "../utils/trajectory/trajectory.build";
import { DatasetBuilder } from "../utils/trajectory/trajectory.datasetBuilder";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import { H3Trajectory, ModelSample, TokenizedTrajectory } from "../utils/trajectory/trajectory.types";
import { SimpleEmbeddingService } from "./embedding.service";
import { CalibrationGroupingService } from "./groups.service";
import { ParseService } from "./parse.service";

export class mainService {
        constructor(
            private readonly parser: ParseService = new ParseService,
            private readonly tokenizer: H3Tokenizer = new H3Tokenizer,
            private readonly builder: DatasetBuilder = new DatasetBuilder,
            private readonly repo = new SqliteRepository(),
            private readonly group = new CalibrationGroupingService(new SimpleEmbeddingService(128),new SimilarityGraphBuilder, new ConnectedComponentsService)
        ) {}

    async getRoutes(buffer: Buffer): Promise<any[]> {
        const rawDB = await this.repo.dump(buffer);
        const parsed = await this.parser.parse(rawDB);
        const tokens = await this.tokenizeRoutes(parsed);
        const result = await this.group.group(tokens,0.95);
        saveJSON(result)
        return parsed
    }

    async tokenizeRoutes(dataSheets: any[]): Promise<ModelSample[]> {

        const calibrations: H3Trajectory[] = extractCalibrations(dataSheets);
        const trajectories: H3Trajectory[] =  calibrations.map(data => runToH3Trajectory(data)).filter((x): x is H3Trajectory => x !== null);
        const tokenizedTrajectories: TokenizedTrajectory[] = trajectories.map(trajectory => this.tokenizer.tokenizeTrajectory(trajectory));
        const dataSet: ModelSample[] = this.builder.buildBatch(tokenizedTrajectories);

        return dataSet
    }
}
