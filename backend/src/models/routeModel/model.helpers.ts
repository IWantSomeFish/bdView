import { TokenizedTrajectory } from "../../utils/trajectory/trajectory.types";

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

     const maxLength = Math.max(a.length, b.length);

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < maxLength; i++) {
        const av = a[i] ?? 0;
        const bv = b[i] ?? 0;

        dot += av * bv;
        normA += av * av;
        normB += bv * bv;
    }

    const lengthA = Math.sqrt(normA);
    const lengthB = Math.sqrt(normB);

    const denominator = lengthA * lengthB;

    const result = denominator === 0 ? 0 : dot / denominator;
    return result
}

export function createRouteFeatures(calibrationA: TokenizedTrajectory, calibrationB: TokenizedTrajectory): number[] {
    const lengthDiff: number = lengthDiffirence(calibrationA,calibrationB)
    const similarity: number = routesSimilarity(calibrationA,calibrationB)
    const cosin: number = cosinSimilarity(calibrationA.tokenIds, calibrationB.tokenIds)
    return [similarity,cosin,lengthDiff]
       
}