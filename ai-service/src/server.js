import dotenv from "dotenv";
import { createApp } from "./app.js";

dotenv.config();

const port = Number(process.env.AI_SERVICE_PORT || 5000);
const app = createApp();

app.listen(port, () => {
  console.log(`AI service listening on http://localhost:${port}`);
});
