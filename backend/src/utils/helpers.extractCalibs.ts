import { Calibration, Route } from "../types/api.types";
import { H3Trajectory } from "./trajectory/trajectory.types";

export function extractCalibrations(routes: Route[]): Calibration[] {
    const runs: Calibration[] = [];

    for (const route of routes) {
        const routeSegments = route.segments ?? [];

        for (const segment of routeSegments) {
            const calibrationRuns = segment.calibrations ?? [];

            for (const run of calibrationRuns) {
                if (run.source === "MANUAL")
                    runs.push({
                        ...run
                });
            }
        }
    }

    return runs; 
}