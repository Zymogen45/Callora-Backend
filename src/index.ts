import "./config/env.js";
import type { Socket } from "net";
import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { initializeDb, closeDb } from "./db/index.js";
import { closePgPool } from "./db.js";
import { closeDbPool } from "./config/health.js";
import { disconnectPrisma } from "./lib/prisma.js";
import { createGracefulShutdownHandler } from "./lifecycle/shutdown.js";

// Re-exported for backward compatibility with existing consumers/tests.
export {
  createGracefulShutdownHandler,
  createInFlightDrainTracker,
  type DrainableSubsystem,
} from "./lifecycle/shutdown.js";

/** The fully wired Express application (see `createApp` in ./app.ts). */
export const app = createApp();

const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith("index.ts") || process.argv[1].endsWith("index.js"));

async function startServer(): Promise<void> {
  try {
    await initializeDb();

    const server = app.listen(config.port, () => {
      console.log(`Callora backend listening on http://localhost:${config.port}`);
    });

    const activeConnections = new Set<Socket>();
    server.on("connection", (socket: Socket) => {
      activeConnections.add(socket);
      socket.once("close", () => activeConnections.delete(socket));
    });

    const gracefulShutdown = createGracefulShutdownHandler({
      server,
      activeConnections,
      closeDatabase: async () => {
        await closeDb();
        await Promise.allSettled([closePgPool(), disconnectPrisma(), closeDbPool()]);
      },
      subsystems: [],
      timeoutMs: 30_000,
    });

    const onSignal = (signal: NodeJS.Signals) => {
      void gracefulShutdown(signal).then((code: number) => process.exit(code));
    };
    process.once("SIGTERM", () => onSignal("SIGTERM"));
    process.once("SIGINT", () => onSignal("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (isDirectExecution) {
  void startServer();
}

export default app;
