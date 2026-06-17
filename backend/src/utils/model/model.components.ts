import { SimilarityEdge } from "./model.types";

export class ConnectedComponentsService {

    build(size: number, edges: SimilarityEdge[]): number[][] {

        const graph = new Map<number, number[]>();

        for (let i = 0; i < size; i++) {
            graph.set(i, []);
        }

        for (const edge of edges) {

            graph.get(edge.from)!.push(edge.to);
            graph.get(edge.to)!.push(edge.from);
        }

        const visited = new Set<number>();
        const groups: number[][] = [];

        for (let start = 0; start < size; start++) {

            if (visited.has(start)) {
                continue;
            }

            const group: number[] = [];
            const stack = [start];

            while (stack.length > 0) {

                const node = stack.pop()!;

                if (visited.has(node)) {
                    continue;
                }

                visited.add(node);
                group.push(node);

                for (const neighbour of graph.get(node) ?? [] ) {
                    stack.push(neighbour);
                }
            }

            groups.push(group);
        }

        return groups;
    }
}