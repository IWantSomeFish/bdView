import { latLngToCell } from "h3-js";
import { H3Trajectory } from "./trajectory.types";
import { Calibration } from "../../types/api.types";

export function runToH3Trajectory(run: Calibration,resolution = 11): H3Trajectory | null{

    const points = run.snapshots;

    if (!points || points.length === 0) {
        return null;
    }

    // 1. сортировка по времени
    const sorted = [...points].sort(
        (a, b) => a.gpsTimestamp - b.gpsTimestamp,
    );

    // 2. H3 conversion
    const h3Sequence = sorted.map((p) =>
        latLngToCell(p.gpsLatitude, p.gpsLongitude, resolution),
    );

    // 3. дедуп подряд идущих ячеек
    const compressed: string[] = [];

    for (const cell of h3Sequence) {
        const last = compressed[compressed.length - 1];

        if (last !== cell) {
            compressed.push(cell);
        }
    }
    const result: H3Trajectory = {runId: run.runId, routeId: run.routeId, points: compressed}
    return result;
}