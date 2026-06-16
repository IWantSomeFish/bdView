import * as tf from "@tensorflow/tfjs";
import { ModelSample } from "../utils/trajectory/trajectory.types";

export class InferenceService {

    constructor(private readonly model: tf.LayersModel) {}

    async encode(sample: ModelSample): Promise<number[]> {

        const inputIds = tf.tensor2d([sample.inputIds], [1, sample.inputIds.length], "int32");
        const attentionMask = tf.tensor2d([sample.attentionMask], [1, sample.attentionMask.length], "float32");
        const embedding = this.model.predict([inputIds, attentionMask]) as tf.Tensor;

        const result = Array.from(await embedding.data());
        embedding.dispose();

        return result;
    }
}