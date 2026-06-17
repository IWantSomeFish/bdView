import { SqliteRepository } from "../repositories/sqlite.repository";
<<<<<<< HEAD
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
||||||| 334d398
import { REQUIRED_TABLES } from "../types/api.types";
=======
import { REQUIRED_TABLES } from "../types/api.types";
import { extractCalibrations } from "../utils/helpers.extractCalibs";
import { saveJSON } from "../utils/helpers.saveJSON";
import { ConnectedComponentsService } from "../utils/model/model.components";
import { SimilarityGraphBuilder } from "../utils/model/model.graphBuilder";
import { CalibrationGroup } from "../utils/model/model.types";
import { runToH3Trajectory } from "../utils/trajectory/trajectory.build";
import { DatasetBuilder } from "../utils/trajectory/trajectory.datasetBuilder";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import { H3Trajectory, ModelSample, TokenizedTrajectory } from "../utils/trajectory/trajectory.types";
import { SimpleEmbeddingService } from "./embedding.service";
import { CalibrationGroupingService } from "./groups.service";
import { ParseService } from "./parse.service";
>>>>>>> origin/master

<<<<<<< HEAD
export class mainService {
        constructor(
            private readonly parser: ParseService = new ParseService,
            private readonly tokenizer: H3Tokenizer = new H3Tokenizer,
            private readonly builder: DatasetBuilder = new DatasetBuilder,
            private readonly repo = new SqliteRepository(),
        ) {}
||||||| 334d398
export class ParseService {
    constructor(
        private readonly repo = new SqliteRepository(),
    ) { }
=======
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
        const result = await this.parser.parse(rawDB);

        return result
    }

    async getSimilar(parsedDB: any[],buffer: Buffer): Promise<any[]> {
        const rawDB = await this.repo.dump(buffer);
        const tokens = await this.tokenizeRoutes(parsedDB);
        const result = await this.buildOutput(rawDB,await this.group.group(tokens,0.95));

        return result
    }
    private async tokenizeRoutes(dataSheets: any[]): Promise<ModelSample[]> {

        const calibrations: H3Trajectory[] = extractCalibrations(dataSheets);
        const trajectories: H3Trajectory[] =  calibrations.map(data => runToH3Trajectory(data)).filter((x): x is H3Trajectory => x !== null);
        const tokenizedTrajectories: TokenizedTrajectory[] = trajectories.map(trajectory => this.tokenizer.tokenizeTrajectory(trajectory));
        const dataSet: ModelSample[] = this.builder.buildBatch(tokenizedTrajectories);

        return dataSet
    }

    private async buildOutput(database: any, routeGroups: CalibrationGroup[]) {
>>>>>>> origin/master

<<<<<<< HEAD
    async getRoutes(buffer: Buffer): Promise<any[]> {
        const rawDB = await this.repo.dump(buffer);
        const parsed = await this.parser.parse(rawDB)
        const tokens = await this.tokenizeRoutes(parsed)
        const canonicalClusters = await this.clusteriseRoutes(tokens,Number(getEnvVariable("MAX_SEQUENCE_LENGTH")))
        const canonicalRouters = canonicalClusters.map(c => c.canonical);
        for (const sample of canonicalRouters) {
            await this.repo.cloneAsAutoOptimized(rawDB, sample.runId);
        }
        const result = await this.parser.parse(rawDB)
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
        saveJSON(canonical)

        return canonical
    }
}
||||||| 334d398
    async parse(buffer: Buffer) {
        const raw = await this.repo.dump(buffer);
        const tables: Record<string, unknown> = {};

        for (const table of REQUIRED_TABLES) {
            tables[table] = raw[table] ?? [];
        }
        const routes = tables.routes as any[];
        const routeSegments = tables.route_segments as any[];
        const calibrations = tables.calibration_runs as any[];
        const snapshots = tables.raw_calibration_snapshots as any[];

        const calibrationsWithSnapshots = connectTables(
            calibrations,
            snapshots,
            "runId",
            "calibrationRunId",
            "snapshotPoints"
        )
        const segmentsCalibrations = connectTables(
            routeSegments,
            calibrationsWithSnapshots,
            "segmentId",
            "segmentId",
            "calibrations",
        );

        const routesWithSegments = connectTables(
            routes,
            segmentsCalibrations,
            "routeId",
            "routeId",
            "routeSegments",
        );
        return routesWithSegments;
    }
}

function connectTables<TParent extends Record<string, any>, TChild extends Record<string, any>
>(parents: TParent[], children: TChild[], parentKey: keyof TParent, childKey: keyof TChild, childField: string) {
    const childrenMap = new Map<any, TChild[]>();

    for (const child of children) {
        const key = child[childKey];
        const list = childrenMap.get(key) ?? [];
        list.push(child);

        childrenMap.set(key, list);
    }

    return parents.map(parent => ({
        ...parent,
        [childField]: childrenMap.get(parent[parentKey]) ?? []
    }))
}
=======
        const tables: Record<string, unknown> = {};
        for (const table of REQUIRED_TABLES) {tables[table] = database[table] ?? []}
        const routes = tables.routes as any[];
        const routeSegments = tables.route_segments as any[];
        const calibrations_table = tables.calibration_runs as any[];
        const result = [];

        for (const [index, group] of routeGroups.entries()) {

            const routeResult: {id: number, routes: any[]} = {id: index + 1, routes: []};
            const listedElements: string[] = []
            for (const calibration of group.calibrations) {
                const routeExists = routes.find(route => route.routeId === calibration.routeId,);

                if (!routeExists) {continue}

                if (!listedElements.includes(calibration.routeId)) {
                    listedElements.push(calibration.routeId);
                    routeResult.routes.push({
                        ...routeExists,
                        segments: [],
                    });
                }           
            }
            listedElements.length = 0;
            for (const calibration of group.calibrations) {
                const segmentExists = routeSegments.find(segment => segment.segmentId === calibration.segmentId)
                if (!segmentExists) {continue}

                if(!listedElements.includes(calibration.segmentId)) {
                    listedElements.push(calibration.segmentId)
                    const route = routeResult.routes.find(route => route.routeId === calibration.routeId)
                    if (!route) {continue}
                    route.segments.push({
                        ...segmentExists,
                        calibrations: []
                    })
                }
            }
            listedElements.length = 0;
            for(const calibration of group.calibrations) {
                const calibrationExists = calibrations_table.find(calib => calib.runId === calibration.runId)
                if (!calibrationExists) {continue}

                if(!listedElements.includes(calibration.runId)){
                    listedElements.push(calibration.runId)
                    const route = routeResult.routes.find(route => route.routeId === calibration.routeId)
                    if (!route) {continue}
                    const segment = route.segments.find((segment: { segmentId: string; }) => segment.segmentId === calibration.segmentId)
                    if(!segment) {continue}
                    segment.calibrations.push({
                        ...calibrationExists
                    })
                }
            }
            result.push(routeResult);
        }

    return result;
    }
}
>>>>>>> origin/master
