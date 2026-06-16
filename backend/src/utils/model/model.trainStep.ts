import * as tf from "@tensorflow/tfjs";
import { TripletBatch } from "../trajectory/trajectory.types";
import { encodeSample, tripletLoss } from "./model.tripletLoss";

export async function trainStep(
    batch: TripletBatch,
    model: tf.LayersModel,
    optimizer: tf.Optimizer,
): Promise<number> {

    const lossTensor = optimizer.minimize(() => {

        const anchorEmb = encodeSample(model, batch.anchor);
        const positiveEmb = encodeSample(model, batch.positive);
        const negativeEmb = encodeSample(model, batch.negative);

        return tripletLoss(anchorEmb, positiveEmb, negativeEmb);

    }, true) as tf.Scalar;

    const loss = (await lossTensor.data())[0];

    lossTensor.dispose();

    return loss;
}