export function cluster(sim: number[][], threshold = 0.85) {

    const n = sim.length;
    const visited = new Array(n).fill(false);
    const clusters: number[][] = [];

    for (let i = 0; i < n; i++) {

        if (visited[i]) continue;

        const cluster = [i];
        visited[i] = true;

        for (let j = i + 1; j < n; j++) {

            if (!visited[j] && sim[i][j] >= threshold) {
                cluster.push(j);
                visited[j] = true;
            }
        }

        clusters.push(cluster);
    }

    return clusters;
}