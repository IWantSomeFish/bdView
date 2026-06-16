import { createRouteEncoderModel } from "../utils/model/model.routeEncoder";
import { PairBuilder } from "../utils/trajectory/trajectory.pairBuilder";
import { train } from "../utils/model/model.train";
import { runToH3Trajectory } from "../utils/trajectory/trajectory.build";
import { H3Tokenizer } from "../utils/trajectory/trajectory.tokenize";
import { DatasetBuilder } from "../utils/trajectory/trajectory.datasetBuilder";
import type { H3Trajectory } from "../utils/trajectory/trajectory.types";
import { TokenSimilarityService } from "../utils/trajectory/trajectory.similiraty";
import { getEnvVariable } from "../utils/env.helper";

export async function trainModel(calibrations: any[]) {;

    console.log(`Loaded: ${calibrations.length}`);

    const trajectories: H3Trajectory[] = [];

    for (const calib of calibrations) {

        const trajectory = runToH3Trajectory(calib);

        if (trajectory) {
            trajectories.push(trajectory);
        }
    }

    console.log(`Valid trajectories: ${trajectories.length}`);

    const tokenizer = new H3Tokenizer();

    const datasetBuilder = new DatasetBuilder(Number(getEnvVariable("MAX_SEQUENCE_LENGTH")));

    const samples = trajectories.map(t => datasetBuilder.build(tokenizer.tokenizeTrajectory(t)));

    console.log(`Samples: ${samples.length}`);

    const pairBuilder = new PairBuilder(new TokenSimilarityService);
    const triplets = pairBuilder.build(samples);
    const uniqueTokens = new Set(samples.flatMap(x => x.inputIds))
    console.log(`Triplets: ${triplets.length}`);

    if (triplets.length === 0) {
        throw new Error("No triplets generated — check similarity thresholds");
    }

    const model = createRouteEncoderModel(uniqueTokens.size, 512);

    console.log("Starting training...");

    await train(triplets, model,10);

    console.log("Saving model...");

    await model.save("file://./models/route-encoder");

    console.log("Done.");
}