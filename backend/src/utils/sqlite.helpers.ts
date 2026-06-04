export function getTables(db: any): string[] {
    const res = db.exec(`
        SELECT name
        FROM sqlite_master
        WHERE type='table'
        AND name NOT LIKE 'sqlite_%'
    `);

    if (!res.length) return [];

    return res[0].values.map((r: any) => String(r[0]));
}

export function selectAll(db: any, table: string) {
    return db.exec(`SELECT * FROM "${table}"`);
}