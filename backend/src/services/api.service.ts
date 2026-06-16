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
        ) {}

    async getRoutes(buffer: Buffer): Promise<any[]> {
        const result = await this.parser.parse(buffer)
        this.tokenizeRoutes(result)
        return result
    }

    async tokenizeRoutes(dataSheets: any[]) {
        const calibrations: H3Trajectory[] = extractCalibrations(dataSheets)
        const trajectories: H3Trajectory[] =  calibrations.map(data => runToH3Trajectory(data)).filter((x): x is H3Trajectory => x !== null)
        const tokenizedTrajectories: TokenizedTrajectory[] = trajectories.map(trajectory => this.tokenizer.tokenizeTrajectory(trajectory))
        const dataSet: ModelSample[] = this.builder.buildBatch(tokenizedTrajectories)
        saveJSON(dataSet)
    }
}

export function extractCalibrations(routes: any[]): H3Trajectory[] {
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