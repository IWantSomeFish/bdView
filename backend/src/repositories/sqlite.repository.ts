import { openDatabase } from "../utils/sql.js";
import { getTables, selectAll } from "../utils/sqlite.helpers.js";
import { rowsToObjects } from "../utils/sqlite.mappers.js";

export class SqliteRepository {
    async dump(buffer: Buffer) {
        const db = await openDatabase(buffer);

        const tables = getTables(db);

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
}