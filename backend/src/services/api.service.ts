import { SqliteRepository } from "../repositories/sqlite.repository";
import { sampleToOrderedVector } from "../utils/clusterise/cluster.orderedVec";
import { selectCanonicalSample } from "../utils/clusterise/cluster.selectCanonical";
import { buildSimilarityMatrix } from "../utils/clusterise/cluster.simMatrix";
import { cluster } from "../utils/clusterise/clustering";
import { getEnvVariable } from "../utils/env.helper";
import { extractCalibrations } from "../utils/helpers.extractCalibs";
import { saveJSON } from "../utils/helpers.saveJSON";
import { runToH3Trajectory } from "../utils/trajectory/trajectory.build";
import { DatasetBuilder } from "../utils/trajectory/trajectory.datasetBuilder";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import { H3Trajectory, ModelSample, TokenizedTrajectory } from "../utils/trajectory/trajectory.types";
import { ParseService } from "./parse.service";

export class mainService {
        constructor(
            private readonly parser: ParseService = new ParseService,
            private readonly tokenizer: H3Tokenizer = new H3Tokenizer,
            private readonly builder: DatasetBuilder = new DatasetBuilder,
            private readonly repo = new SqliteRepository(),
        ) {}

    async getRoutes(buffer: Buffer): Promise<any[]> {
        const rawDB = await this.repo.dump(buffer);
        const parsed = await this.parser.parse(rawDB)
        const tokens = await this.tokenizeRoutes(parsed)
        const canonicalClusters = await this.clusteriseRoutes(tokens,Number(getEnvVariable("MAX_SEQUENCE_LENGTH")))
        const canonicalRouters = canonicalClusters.map(c => c.canonical);
        saveJSON(canonicalRouters)
        const result = await this.parser.parse(this.repo.cloneAsAutoOptimized(rawDB,canonicalRouters))
        saveJSON(result)
        
        return result
    }

    async tokenizeRoutes(dataSheets: any[]): Promise<ModelSample[]> {

        const calibrations: H3Trajectory[] = extractCalibrations(dataSheets)
        const trajectories: H3Trajectory[] =  calibrations.map(data => runToH3Trajectory(data)).filter((x): x is H3Trajectory => x !== null)
        const tokenizedTrajectories: TokenizedTrajectory[] = trajectories.map(trajectory => this.tokenizer.tokenizeTrajectory(trajectory))
        const dataSet: ModelSample[] = this.builder.buildBatch(tokenizedTrajectories)

        return dataSet
    }

    async clusteriseRoutes(dataset: ModelSample[], vocabSize: number) {

        const vectors = dataset.map(data => sampleToOrderedVector(data,vocabSize));
        const sim = buildSimilarityMatrix(vectors);
        const clusters = cluster(sim, 0.85)
        const objectClusters = clusters.map(cluster =>cluster.map(i => dataset[i]));
        const canonical = objectClusters.map(cluster => ({canonical: selectCanonicalSample(cluster, vocabSize),cluster}))

        return canonical
    }
}