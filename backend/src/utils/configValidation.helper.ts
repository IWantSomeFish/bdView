import { TrainParams } from "../models/routeModel/model.types";

export function parseTrainingConfig(value: unknown): TrainParams {

    const config = JSON.parse(String(value)) as Partial<TrainParams>;

    return {
        epochs: config.epochs ?? 100,
        learningRate: config.learningRate ?? 0.001,
        maxLengthDiffirence: config.maxLengthDiffirence ?? 0.3,
        minRouteSimiliraty: config.minRouteSimiliraty ?? 0.7,
        minCosin: config.minCosin ?? 0.7,
    };
}