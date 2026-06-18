import { getEnvVariable } from "../utils/env.helper";
import { TokenizedTrajectory,ModelSample } from "../utils/trajectory/trajectory.types";

export class trajectoryService {
    constructor(
        private readonly maxLength: number = Number(getEnvVariable("MAX_SEQUENCE_LENGTH")),
    ) {}

    build(trajectory: TokenizedTrajectory): ModelSample {
        const inputIds = trajectory.tokenIds.slice(0, this.maxLength);

        const attentionMask = new Array(inputIds.length).fill(1);

        while (inputIds.length < this.maxLength) {
            inputIds.push(Number(getEnvVariable("PAD_TOKEN")));
            attentionMask.push(0);
        }

        return {
            runId: trajectory.runId,
            routeId: trajectory.routeId,
            segmentId: trajectory.segmentId,

            inputIds,
            attentionMask,
        };
    }

    buildBatch(trajectories: TokenizedTrajectory[]): ModelSample[] {
        return trajectories.map((trajectory) =>
            this.build(trajectory),
        );
    }
}