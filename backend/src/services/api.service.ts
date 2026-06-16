import { ParseService } from "./parse.service";

export class mainService {
        constructor(
            private readonly parser: ParseService = new ParseService
        ) {}

    async getRoutes(buffer: Buffer) {
        return this.parser.parse(buffer)
    }
}