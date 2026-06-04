export function rowsToObjects(
    columns: string[],
    values: any[][],
) {
    return values.map(row =>
        Object.fromEntries(
            columns.map((col, i) => [
                col,
                row[i],
            ]),
        ),
    );
}