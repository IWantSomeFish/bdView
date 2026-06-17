import { cosine } from "./cluster.similiraty";

export function buildSimilarityMatrix(vectors: number[][]) {

    const n = vectors.length;

    const sim = Array.from({ length: n }, () =>
        new Array(n).fill(0)
    );

    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {

            const s = cosine(vectors[i], vectors[j]);

            sim[i][j] = s;
            sim[j][i] = s;
        }
    }

    return sim;
}