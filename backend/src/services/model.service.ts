import { runToH3Trajectory } from "../utils/trajectory/trajectory.build";
import { DatasetBuilder } from "../utils/trajectory/trajectory.datasetBuilder";
import { PairBuilder } from "../utils/trajectory/trajectory.pairBuilder";
import { TokenSimilarityService } from "../utils/trajectory/trajectory.similiraty";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import { H3Trajectory, ModelSample, TokenizedTrajectory } from "../utils/trajectory/trajectory.types";

export class ModelService {
    constructor(
        private readonly tokenizer = new H3Tokenizer(),
        private readonly datasetBuilder = new DatasetBuilder(),
        private readonly pairBuilder = new PairBuilder(new TokenSimilarityService),
    ) {
    }

    async canonizeRoute(parsedDatabase: any[]) {
        const calibrations: any[] = this.extractCalibrations(parsedDatabase);
        const calibH3: H3Trajectory[] = []
        for (const calib of calibrations) {
            const c = runToH3Trajectory(calib)
            if (c) {
                calibH3.push(c)
            }

        }
        const tokenizedCalibs: TokenizedTrajectory[] = calibH3.map(run => this.tokenizer.tokenizeTrajectory(run))
        const dataset: ModelSample[] = this.datasetBuilder.buildBatch(tokenizedCalibs);
        const triplets = this.pairBuilder.build(dataset);
        console.log(triplets)
    }

    extractCalibrations(routes: any[]): H3Trajectory[] {
    const runs: H3Trajectory[] = [];

    for (const route of routes) {
        const routeSegments = route.routeSegments ?? [];

        for (const segment of routeSegments) {
            const calibrationRuns = segment.calibrations ?? [];

            for (const run of calibrationRuns) {
                if (run.source === "MANUAL")
                    runs.push({
                    runId: run.runId,
                    routeId: run.routeId,
                    segmentId: run.segmentId,
                    points: run.snapshotPoints
                });
            }
        }
    }

    return runs; 
    }
}