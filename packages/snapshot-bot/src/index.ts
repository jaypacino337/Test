import { loadConfig, storeFromConfig } from "@sherwood/shared";
import { startScheduler } from "./scheduler";
import { startApi } from "./api";

export { fetchHolders } from "./holders";
export { computePayouts, dropUnfundable, executePlan, makePlan } from "./distribute";
export { runFullCycle, startScheduler } from "./scheduler";
export { createApi, startApi } from "./api";

function main() {
  const config = loadConfig();
  const store = storeFromConfig(config);

  const server = startApi(store, config);
  const scheduler = startScheduler(store);

  let stopping = false;
  const shutdown = async (sig: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`\n[bot] ${sig}: finishing the current cycle, then exiting...`);
    await scheduler.stop();
    server.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

if (require.main === module) {
  main();
}
