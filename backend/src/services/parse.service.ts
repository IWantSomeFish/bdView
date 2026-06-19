import { SqliteRepository } from "../repositories/sqlite.repository";
import { REQUIRED_TABLES, Route } from "../types/api.types";

export class ParseService {
    constructor(
        private readonly repo = new SqliteRepository(),
    ) { }

    async parse(raw: any): Promise<Route[]> {
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
            "snapshots",
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
            "segments",
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
