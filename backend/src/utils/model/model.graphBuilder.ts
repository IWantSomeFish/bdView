import { similiraty } from "./model.similiraty";
import { CalibrationEmbedding, SimilarityEdge } from "./model.types";

export class SimilarityGraphBuilder {

    constructor() {}

    build(embeddings: CalibrationEmbedding[], threshold: number): SimilarityEdge[] {

        const edges: SimilarityEdge[] = [];

        for (let i = 0; i < embeddings.length; i++) {

            for (let j = i + 1; j < embeddings.length; j++) {

                const score =
                    similiraty(
                        embeddings[i].embedding,
                        embeddings[j].embedding,
                    );

                if (score >= threshold) {

                    edges.push({from: i, to: j, score});
                }
            }
        }

        return edges;
    }
}