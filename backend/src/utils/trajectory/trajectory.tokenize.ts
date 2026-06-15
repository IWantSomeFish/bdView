import { H3Trajectory, TokenizedTrajectory } from "./trajectory.types";

export class H3Tokenizer {
    private readonly vocab = new Map<string, number>();
    private nextId = 1;

    tokenizeCell(h3: string): number {
        let tokenId = this.vocab.get(h3);

        if (tokenId !== undefined) {
            return tokenId;
        }

        tokenId = this.nextId++;

        this.vocab.set(h3, tokenId);

        return tokenId;
    }

    tokenizeTrajectory(trajectory: H3Trajectory): TokenizedTrajectory {
        return {
            runId: trajectory.runId,
            routeId: trajectory.routeId,
            segmentId: trajectory.segmentId,

            tokenIds: trajectory.points.map((h3) =>
                this.tokenizeCell(h3),
            ),
        };
    }
}