import { ParseRepository } from "../repositories/parse.repository.js";

export class ParseService {
    constructor(
        private readonly repository: ParseRepository,
    ) {}

    async parseDatabase(
        buffer: Buffer,
    ): Promise<unknown[]> {
        return this.repository.parseDatabase(
            buffer,
        );
    }
}