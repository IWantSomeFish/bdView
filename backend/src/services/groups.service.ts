import { ConnectedComponentsService } from "../utils/model/model.components";
import { SimilarityGraphBuilder } from "../utils/model/model.graphBuilder";
import { CalibrationGroup } from "../utils/model/model.types";
import { ModelSample } from "../utils/trajectory/trajectory.types";
import { SimpleEmbeddingService } from "./embedding.service";

export class CalibrationGroupingService {

    constructor(
        private readonly embeddingService: SimpleEmbeddingService,
        private readonly graphBuilder: SimilarityGraphBuilder,
        private readonly components: ConnectedComponentsService,
    ) {}

    async group(calibrations: ModelSample[], threshold = 0.9): Promise<CalibrationGroup[]> {

        const embeddings = await this.embeddingService.embed(calibrations);

        const edges = this.graphBuilder.build(embeddings, threshold);

        const groups = this.components.build(embeddings.length, edges);

        return groups.map((indices, index) => ({
                id: `group_${index}`,
                calibrations: indices.map(i => embeddings[i].calibration),
            }),
        );
    }
}