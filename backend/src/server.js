import { createApp } from "./app.js";
import { checkDatabaseConnection } from "./config/database.js";
import { config } from "./config/index.js";
import { bootstrapDatabase } from "./database/bootstrap.js";

const app = createApp();

async function bootstrap() {
  try {
    await checkDatabaseConnection();
    await bootstrapDatabase();
    app.listen(config.port,"0.0.0.0" ,() => {
      console.log(`Backend listening on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

bootstrap();
