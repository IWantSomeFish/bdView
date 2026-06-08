import { REQUIRED_COLUMNS, REQUIRED_TABLES } from "../types/api.types.js";
import { openDatabase } from "../utils/sql.js";
import { getTables, selectAll } from "../utils/sqlite.helpers.js";
import { rowsToObjects } from "../utils/sqlite.mappers.js";

export class SqliteRepository {
    async dump(buffer: Buffer) {
        const db = await openDatabase(buffer);

        const tables = getTables(db);
        this.validateTables(tables)
        for (const table of REQUIRED_TABLES){
            const info = db.exec(`PRAGMA table_info(${table})`)
            const columns = info[0].values.map((row: any[]) => row[1]);

            if (table in REQUIRED_COLUMNS) {
                this.validateColumns(table as keyof typeof REQUIRED_COLUMNS, columns);
            }
        };

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
            throw new Error(`Table validation. Missing following tables: ${missingTables.join(", ")}`)
        }
    }
    
    validateColumns(table: keyof typeof REQUIRED_COLUMNS, actualColumns: string[]) {
        const requiredColumns = REQUIRED_COLUMNS[table]

        const missing = requiredColumns.filter(col => !actualColumns.includes(col));

        if (missing.length > 0) {
            throw new Error(`Columns validation in ${table}. Missing columns: ${missing.join(", ")}`)
        }
    }
}