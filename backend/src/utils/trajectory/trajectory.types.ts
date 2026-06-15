export type H3Trajectory = {
    runId: string;
    routeId: string;
    segmentId: string;
    points: string[];
};

export type TokenizedTrajectory = {
    runId: string;
    routeId: string;
    segmentId: string;

    tokenIds: number[];
};

export type ModelSample = {
    runId: string;
    routeId: string;
    segmentId: string;

    inputIds: number[];
    attentionMask: number[];
};