export interface H3Trajectory {
    runId: string;
    routeId: string;

    points: string[];
};

export interface TokenizedTrajectory {
    runId: string;
    routeId: string;

    tokenIds: number[];
};