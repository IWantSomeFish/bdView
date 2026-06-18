import { ModelSample, routeTrigrams } from "./trajectory/trajectory.types";

export function route2vector(route: ModelSample): routeTrigrams {
    const trimgrams: string[] = []
    for (let i = 0; i < route.inputIds.length - 2; i++){
        trimgrams.push(`${route.inputIds[i]}_${route.inputIds[i+1]}_${route.inputIds[i+2]}`)
    }
    return {
        runId: route.runId,
        routeId: route.routeId,
        segmentId: route.segmentId,
        vector: trimgrams
    }
}