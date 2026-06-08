import { app } from "./app.js";
import { getEnvVariable } from "./utils/env.helper.js";

const PORT = Number(getEnvVariable("BACKEND_PORT"));
app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
    console.log(`Server healthcheck: http://localhost:${PORT}/api/health`);
});