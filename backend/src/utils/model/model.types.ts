import { ModelSample } from "../trajectory/trajectory.types";

export type CalibrationEmbedding = {
    calibration: ModelSample;

    embedding: number[];
};

export type CalibrationGroup = {
    id: string;

    calibrations: ModelSample[];
};

export type SimilarityEdge = {
    from: number;
    to: number;

    score: number;
};