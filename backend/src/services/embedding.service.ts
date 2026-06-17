import { CalibrationEmbedding } from "../utils/model/model.types";
import { ModelSample } from "../utils/trajectory/trajectory.types";

export class SimpleEmbeddingService {

    constructor(
        private readonly vocabSize: number,
    ) {}

    async embed(calibrations: ModelSample[]): Promise<CalibrationEmbedding[]> {

        return calibrations.map(calibration => ({calibration, embedding: this.toVector(calibration.inputIds)}));
    }

    private toVector(tokens: number[]): number[] {

        const vec = new Array(this.vocabSize).fill(0);

        for (let i = 0; i < tokens.length; i++) {

            const token = tokens[i];

            if (token < 0 || token >= this.vocabSize) {
                continue;
            }

            vec[token] += 1 / (i + 1);
        }

        return vec;
    }
}