import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    return value !== undefined ? value : "";
}