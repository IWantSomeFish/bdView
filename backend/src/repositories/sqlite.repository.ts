import { Database } from "sql.js";
import { REQUIRED_COLUMNS, REQUIRED_TABLES } from "../types/api.types.js";
import { openDatabase } from "../utils/sql.js";
import { getTables, selectAll } from "../utils/sqlite.helpers.js";
import { rowsToObjects } from "../utils/sqlite.mappers.js";
import { ValidationError } from "../middlewares/errors/error.validation.js";

export class SqliteRepository {
    async dump(buffer: Buffer) {
        const db: Database = await openDatabase(buffer);

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
        db.close()
        return result;
    }

    validateTables(tables: string[]) {

        const missingTables = REQUIRED_TABLES.filter(table => !tables.includes(table));

        if (missingTables.length > 0) {
            throw new ValidationError(`Required tables are missing:" ${missingTables.join(", ")}`)
        }
    }
    
    validateColumns(table: keyof typeof REQUIRED_COLUMNS, actualColumns: string[]) {
        const requiredColumns = REQUIRED_COLUMNS[table]

        const missing = requiredColumns.filter(col => !actualColumns.includes(col));

        if (missing.length > 0) {
            throw new ValidationError(`Validation in ${table} fall. Next collums are missing:" ${missing.join(", ")}`)
        }
    }

    cloneAsAutoOptimized(rawDB: any, canonicalRouters: any) {
        for (const sample of canonicalRouters) {
        
        const original = rawDB.calibration_runs.find(
            (r: any) => r.runId === sample.runId
        );

        if (!original) return;

        const clone = {
            ...original,
            runId: crypto.randomUUID(), // новый PK
            source: "AUTO_OPTIMIZED",
            original_calib: sample.runId
            
        };

        rawDB["calibration_runs"].push(clone);
    }
        return rawDB
}
}