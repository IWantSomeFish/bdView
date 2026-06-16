import { H3Trajectory } from "./trajectory/trajectory.types";

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