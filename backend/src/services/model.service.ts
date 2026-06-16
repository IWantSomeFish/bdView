import { runToH3Trajectory } from "../utils/trajectory/trajectory.build";
import { DatasetBuilder } from "../utils/trajectory/trajectory.datasetBuilder";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import { H3Trajectory, ModelSample, TokenizedTrajectory } from "../utils/trajectory/trajectory.types";
import { ClusterService } from "./clustering.service";
import { InferenceService } from "./inference.service";
import * as tf from "@tensorflow/tfjs"
import { MedoidService } from "./medoid.service";
import { cosineSimilarity } from "../utils/trajectory/trajectory.similiraty";

export class ModelService {
    constructor(
        private readonly tokenizer = new H3Tokenizer(),
        private readonly datasetBuilder = new DatasetBuilder(),
        private inference: InferenceService,
        private readonly clusterService = new ClusterService(75),
        private readonly mediodService = new MedoidService((a, b) => cosineSimilarity(a, b))
    ) {
    }

    async init() {
        const model = await tf.loadLayersModel("file://./models/route-encoder")
        this.inference = new InferenceService(model);
    }
    async canonizeRoute(parsedDatabase: any[]) {
        const calibrations: any[] = extractCalibrations(parsedDatabase);
        const trajectories: H3Trajectory[] = calibrations.map(runToH3Trajectory).filter((x): x is H3Trajectory => x !== null);
        const tokenized: TokenizedTrajectory[] = trajectories.map(t => this.tokenizer.tokenizeTrajectory(t));
        const samples: ModelSample[] = this.datasetBuilder.buildBatch(tokenized);

        const embeddings = await Promise.all(samples.map(s => this.inference.encode(s)));
        const clusters = this.clusterService.cluster(embeddings);
        const canonicalRoutes = this.mediodService.select(clusters, samples,embeddings);

    return canonicalRoutes;
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