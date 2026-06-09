import { SqliteRepository } from "../repositories/sqlite.repository";
import { REQUIRED_TABLES } from "../types/api.types";

export class ParseService {
    constructor(
        private readonly repo = new SqliteRepository(),
    ) {}

    async parse(buffer: Buffer) {
        const raw = await this.repo.dump(buffer);
        const tables: Record<string, unknown> = {};
        
        for (const table of REQUIRED_TABLES) {
            tables[table] = raw[table] ?? [];
        }
        const routes = tables.routes as any[];
        const routeSegments = tables.route_segments as any[];
        const wifiFingerprints = tables.wifi_fingerprints as any[];

        const segmentsWithWifi = connectTables(
            routeSegments,
            wifiFingerprints,
            "segmentId",
            "segmentId",
            "wifiFingerprints",
        );

        const routesWithSegments = connectTables(
            routes,
            segmentsWithWifi,
            "routeId",
            "routeId",
            "routeSegments",
        );
    console.log(routesWithSegments[1].routeSegments)
    return routesWithSegments;
    }
}

function connectTables<TParent extends Record<string, any>, TChild extends Record<string, any>
    >(parents: TParent[],children: TChild[], parentKey: keyof TParent, childKey: keyof TChild,childField: string) {
    const childrenMap = new Map<any,TChild[]>();
    
    for (const child of children) {
        const key = child[childKey];
        const list = childrenMap.get(key) ?? [];
        list.push(child);

        childrenMap.set(key,list);
    }

    return parents.map(parent => ({
        ...parent,
        [childField]: childrenMap.get(parent[parentKey]) ?? []
    }))
}
