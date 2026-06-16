import { ModelSample } from "../utils/trajectory/trajectory.types";

export class MedoidService {

    constructor(
        private readonly similarity: (a: number[], b: number[]) => number,
    ) {}

    select(clusters: number[][], samples: ModelSample[], embeddings: number[][]): ModelSample[] {
        const result: ModelSample[] = [];

        for (const cluster of clusters) {

            let bestIndex = cluster[0];
            let bestScore = -Infinity;

            for (const i of cluster) {

                let scoreSum = 0;

                for (const j of cluster) {

                    if (i === j) continue;

                    scoreSum += this.similarity(embeddings[i], embeddings[j]);
                }

                if (scoreSum > bestScore) {
                    bestScore = scoreSum;
                    bestIndex = i;
                }
            }

            result.push(samples[bestIndex]);
        }

        return result;
    }
}