import { getEnvVariable } from "../utils/env.helper";
import { TokenizedTrajectory,ModelSample } from "../utils/trajectory/trajectory.types";

export class trajectoryService {
    constructor(
        private readonly maxLength: number = Number(getEnvVariable("MAX_SEQUENCE_LENGTH")),
    ) {}

    build(trajectory: TokenizedTrajectory): ModelSample {
        const inputIds = trajectory.tokenIds.slice(0, this.maxLength);


        while (inputIds.length < this.maxLength) {
            inputIds.push(Number(getEnvVariable("PAD_TOKEN")));
        }

        return {
            runId: trajectory.runId,
            routeId: trajectory.routeId,
            segmentId: trajectory.segmentId,

            inputIds,
        };
    }

    buildBatch(trajectories: TokenizedTrajectory[]): ModelSample[] {
        return trajectories.map((trajectory) =>
            this.build(trajectory),
        );
    }
}