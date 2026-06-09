import dotenv from "dotenv";
import path from "path";
import { ApiError } from "../middlewares/errors/error.api";
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    if (value === undefined) {
        throw new ApiError(500,`Missing envirment variable: ${key}`)
    }
    return value !== undefined ? value : "";
}