export class ParseRepository {
    async parseDatabase(
        buffer: Buffer,
    ): Promise<unknown[]> {
        console.log(
            "Repository received",
            buffer.length,
            "bytes",
        );

        return [];
    }
}