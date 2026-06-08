import { ApiError } from "./error.api.js";

export class ValidationError extends ApiError {
    constructor(
        message: string,
        details?: unknown,
    ) {
        super(400, message, details);
    }
}