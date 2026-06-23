import { TokenizedTrajectory } from "../trajectory/trajectory.types";

function lengthDiffirence(a: TokenizedTrajectory, b: TokenizedTrajectory): number {
    if (a.tokenIds.length === 0 || b.tokenIds.length === 0) {
        return 0
    }
    const setA = new Set(a.tokenIds)
    const setB = new Set(b.tokenIds)
    const result = (Math.min(setA.size,setB.size) / Math.max(setA.size, setB.size))
    return result
}

function routesSimilarity(a: TokenizedTrajectory, b: TokenizedTrajectory): number {

    const setA = new Set(a.tokenIds)
    const setB = new Set(b.tokenIds)
    let intersection = 0;

    for (const item of setA) {
        if (setB.has(item)) {
            intersection++;
        }
    }

    const union = setA.size + setB.size - intersection;

    return union === 0 ? 0 : intersection / union;
}

function cosinSimilarity(a: number[], b: number[]): number {

    const maxLength = Math.max(a.length,b.length);

    if (maxLength === 0) {
        return 1;
    }

    let difference = 0;

    for (let i = 0; i < maxLength; i++) {
        const av = a[i] ?? 0;
        const bv = b[i] ?? 0;

        difference += Math.abs(av - bv);
    }

    let maxPossibleDifference = 0;

    for (let i = 0; i < maxLength; i++) {
        const av = Math.abs(a[i] ?? 0);
        const bv = Math.abs(b[i] ?? 0);

        maxPossibleDifference += Math.max(av, bv);
    }

    if (maxPossibleDifference === 0) {
        return 1;
    }

    return 1 - difference / maxPossibleDifference;
}

export function createRouteFeatures(calibrationA: TokenizedTrajectory, calibrationB: TokenizedTrajectory): number[] {
    const lengthDiff: number = lengthDiffirence(calibrationA,calibrationB)
    const similarity: number = routesSimilarity(calibrationA,calibrationB)
    const cosin: number = cosinSimilarity(calibrationA.tokenIds, calibrationB.tokenIds)
    return [similarity,cosin,lengthDiff]
       
}