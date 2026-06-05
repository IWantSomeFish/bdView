import { SqliteRepository } from "../repositories/sqlite.repository";

const REQUIRED_TABLES = [
    "routes",
    "route_segments",
    "wifi_fingerprints",
] as const;

export class ParseService {
    constructor(
        private readonly repo = new SqliteRepository(),
    ) {}

    async parse(buffer: Buffer) {
        const raw = await this.repo.dump(buffer);
        const result: Record<string, unknown> = {};

        for (const table of REQUIRED_TABLES) {
            result[table] = raw[table] ?? [];
        }
        // тут потом появится нормализация DTO
        return result;
    }
}