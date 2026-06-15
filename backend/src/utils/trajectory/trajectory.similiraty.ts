import { ModelSample } from "./trajectory.types";

export class TokenSimilarityService {

    similarity(left: ModelSample,
        right: ModelSample,
    ): number {

        const leftTokens =
            this.extractTokens(left);

        const rightTokens =
            this.extractTokens(right);

        return this.jaccardTrigrams(
            leftTokens,
            rightTokens,
        );
    }

    private extractTokens(
        sample: ModelSample,
    ): number[] {

        const result: number[] = [];

        for (let i = 0; i < sample.inputIds.length; i++) {
            if (sample.attentionMask[i] === 1) {
                result.push(sample.inputIds[i]);
            }
        }

        return result;
    }

    private jaccardTrigrams(
        left: number[],
        right: number[],
    ): number {

        const leftSet =
            new Set(this.buildTrigrams(left));

        const rightSet =
            new Set(this.buildTrigrams(right));

        let intersection = 0;

        for (const gram of leftSet) {
            if (rightSet.has(gram)) {
                intersection++;
            }
        }

        const union =
            leftSet.size +
            rightSet.size -
            intersection;

        return union === 0
            ? 0
            : intersection / union;
    }

    private buildTrigrams(
        tokens: number[],
    ): string[] {

        const result: string[] = [];

        for (let i = 0; i < tokens.length - 2; i++) {
            result.push(
                `${tokens[i]}-${tokens[i + 1]}-${tokens[i + 2]}`
            );
        }

        return result;
    }
}