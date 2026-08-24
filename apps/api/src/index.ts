import "dotenv/config";
import { startApi } from "./app";

startApi().catch((err) => {
  console.error("failed to start api:", err);
  process.exit(1);
});
