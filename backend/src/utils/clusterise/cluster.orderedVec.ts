import { getEnvVariable } from "../env.helper";
import { ModelSample } from "../trajectory/trajectory.types";

export function sampleToOrderedVector(sample: ModelSample, vocabSize: number, maxLen = Number(getEnvVariable("MAX_SEQUENCE_LENGTH"))): number[] {

    const vec = new Array(vocabSize).fill(0);

    const tokens = sample.inputIds;

    for (let i = 0; i < Math.min(tokens.length, maxLen); i++) {

        const token = tokens[i];

        if (token < 0 || token >= vocabSize) {
            continue;
        }

        const weight = 1 / (i + 1);

        vec[token] += weight;
    }

    return vec;
}