import * as tf from "@tensorflow/tfjs";
import { ModelSample } from "../trajectory/trajectory.types";

export function tripletLoss(
    anchor: tf.Tensor,
    positive: tf.Tensor,
    negative: tf.Tensor,
    margin = 0.2,
): tf.Scalar {

    return tf.tidy(() => {

        const positiveDistance = tf.sum(tf.square(tf.sub(anchor, positive)),1);

        const negativeDistance = tf.sum(tf.square(tf.sub(anchor, negative)),1);

        const loss = tf.maximum(tf.scalar(0),tf.add(tf.sub(positiveDistance, negativeDistance),tf.scalar(margin)));

        return tf.mean(loss);
    });
}

export function encodeSample(model: tf.LayersModel, sample: ModelSample): tf.Tensor {

    const inputIds = tf.tensor2d([sample.inputIds], [1, sample.inputIds.length],"int32");

    const attentionMask = tf.tensor2d([sample.attentionMask], [1, sample.attentionMask.length], "float32");

    return model.predict([inputIds, attentionMask]) as tf.Tensor;
}