import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceEnvPath = path.resolve(__dirname, "../.env");
const rootEnvPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: serviceEnvPath, override: false });

const { createApp } = await import("./app.js");

const port = Number(process.env.AI_SERVICE_PORT || 5000);
const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`AI service listening on http://localhost:${port}`);
});
