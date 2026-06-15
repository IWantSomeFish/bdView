import { TokenSimilarityService } from "./trajectory.similiraty";
import { ModelSample, TripletBatch } from "./trajectory.types";

export class PairBuilder {
    constructor(
        private readonly similarity: TokenSimilarityService,
    ) {}

    build(
        samples: ModelSample[],
    ): TripletBatch[] {

        const result: TripletBatch[] = [];

        for (const anchor of samples) {

            const neighbours = samples
                .filter(s => s.runId !== anchor.runId)
                .map(sample => ({
                    sample,
                    score: this.similarity.similarity(
                        anchor,
                        sample,
                    ),
                }))
                .sort((a, b) => b.score - a.score);

            if (neighbours.length < 2) {
                continue;
            }

            result.push({
                anchor,
                positive: neighbours[0].sample,
                negative:
                    neighbours[
                        neighbours.length - 1
                    ].sample,
            });
        }

        return result;
    }
}