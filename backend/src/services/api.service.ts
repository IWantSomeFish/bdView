import { SqliteRepository } from "../repositories/sqlite.repository";
import { REQUIRED_TABLES } from "../types/api.types";

export class ParseService {
    constructor(
        private readonly repo = new SqliteRepository(),
    ) {}

    async parse(buffer: Buffer) {
        try {
            const raw = await this.repo.dump(buffer);
            const result: Record<string, unknown> = {};
            for (const table of REQUIRED_TABLES) {
            result[table] = raw[table] ?? [];
        }
        // тут потом появится нормализация DTO
        return result;
        } catch (e) {
            return e
        }
    }
}