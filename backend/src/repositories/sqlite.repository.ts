import { REQUIRED_TABLES } from "../types/api.types.js";
import { openDatabase } from "../utils/sql.js";
import { getTables, selectAll } from "../utils/sqlite.helpers.js";
import { rowsToObjects } from "../utils/sqlite.mappers.js";

export class SqliteRepository {
    async dump(buffer: Buffer) {
        const db = await openDatabase(buffer);

        const tables = getTables(db);
        this.validateTables(tables)
        const result: Record<string, any[]> = {};

        for (const table of tables) {
            const res = selectAll(db, table);

            if (!res.length) {
                result[table] = [];
                continue;
            }

            result[table] = rowsToObjects(
                res[0].columns,
                res[0].values,
            );
        }

        return result;
    }

    validateTables(tables: string[]) {

        const missingTables = REQUIRED_TABLES.filter(table => !tables.includes(table));

        if (missingTables.length > 0) {
            throw new Error("Table validation error")
        }
    }
}