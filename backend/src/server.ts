import path from "path";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const PORT = process.env.BACKEND_PORT;

app.listen(PORT, () => {
    console.log(
        `Server started on ${PORT}\n`,
        `http://localhost:${PORT}`,
    );
});