import { ModelSample } from "../trajectory/trajectory.types";
import { sampleToOrderedVector } from "./cluster.orderedVec";
import { cosine } from "./cluster.similiraty";

export function selectCanonicalSample(cluster: ModelSample[], vocabSize: number): ModelSample {

    const vectors = cluster.map(s =>
        sampleToOrderedVector(s, vocabSize)
    );

    let bestIndex = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < cluster.length; i++) {

        let score = 0;

        for (let j = 0; j < cluster.length; j++) {
            if (i === j) continue;

            score += cosine(vectors[i], vectors[j]);
        }

        if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
        }
    }

    return cluster[bestIndex];
}