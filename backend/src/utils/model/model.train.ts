import * as tf from "@tensorflow/tfjs";
import { TripletBatch } from "../trajectory/trajectory.types";
import { trainStep } from "./model.trainStep";

export async function train(triplets: TripletBatch[],model: tf.LayersModel,epochs = 10): Promise<void> {

    const optimizer = tf.train.adam(1e-4);
    for (let epoch = 0; epoch < epochs; epoch++) {
        let epochLoss = 0;

        for (const triplet of triplets) {
            console.log(`Train step in ${epoch + 1}: ${epochLoss.toFixed(4)}`)
            const loss = await trainStep(triplet, model, optimizer);
            epochLoss += loss;
        }

        console.log(`Epoch ${epoch + 1}: ${epochLoss.toFixed(4)}`);
    }
}