// Entry bundled into the Vercel serverless function (see scripts/build-vercel.mjs).
import type { IncomingMessage, ServerResponse } from "http";
import app from "../src/index.js";
import { initializeDb } from "../src/db/index.js";

// Initialise the (ephemeral, demo-mode) SQLite catalog once per warm instance.
const ready = initializeDb();

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await ready;
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
