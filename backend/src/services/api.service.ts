import { SqliteRepository } from "../repositories/sqlite.repository";

export class ParseService {
    constructor(
        private readonly repo = new SqliteRepository(),
    ) {}

    async parse(buffer: Buffer) {
        const raw = await this.repo.dump(buffer);

        // тут потом появится нормализация DTO
        return raw;
    }
}