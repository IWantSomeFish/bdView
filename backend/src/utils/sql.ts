import initSqlJs from "sql.js";

let SQL: any;

export async function getSql() {
    if (!SQL) {
        SQL = await initSqlJs();
    }
    return SQL;
}

export async function openDatabase(buffer: Buffer) {
    const SQL = await getSql();

    return new SQL.Database(
        new Uint8Array(buffer),
    );
}