export class ClusterService {

    constructor(
        private readonly threshold = 0.85,
    ) {}

    cluster(embeddings: readonly number[][]): number[][] {

        const n = embeddings.length;

        const visited = new Array(n).fill(false);
        let clusters: any;

        for (let i = 0; i < n; i++) {

            if (visited[i]) continue;

            const cluster: number[] = [i];
            visited[i] = true;

            for (let j = i + 1; j < n; j++) {

                if (visited[j]) continue;

                const sim = this.cosine(
                    embeddings[i],
                    embeddings[j],
                );

                if (sim >= this.threshold) {
                    cluster.push(j);
                    visited[j] = true;
                }
            }

            clusters.push(cluster);
        }

        return clusters;
    }

    private cosine(a: number[], b: number[]): number {

        let dot = 0;
        let na = 0;
        let nb = 0;

        for (let i = 0; i < a.length; i++) {

            const av = a[i] ?? 0;
            const bv = b[i] ?? 0;

            dot += av * bv;
            na += av * av;
            nb += bv * bv;
        }

        const denom = Math.sqrt(na) * Math.sqrt(nb);

        if (denom === 0) return 0;

        return dot / denom;
    }
}