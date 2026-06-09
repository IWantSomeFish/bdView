import { NextFunction, Request, Response } from "express";
import { ApiError } from "./errors/error.api.js";


export function errorMiddleware(
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                type: error.name,
                message: error.message,
                details: error.details,
            },
        });

        return;
    }

    console.error(error);

    res.status(500).json({
        success: false,
        error: {
            type: "InternalServerError",
            message: "Internal server error",
        },
    });
}