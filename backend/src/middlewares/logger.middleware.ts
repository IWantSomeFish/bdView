import { Request, Response, NextFunction } from "express";

export function loggerMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
): void {
    console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
    );

    next();
}