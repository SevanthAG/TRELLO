import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "node:path";
import { config } from "dotenv";

// Always load THIS package's .env, regardless of which app imports it.
// dotenv does not override variables that are already set, so an app-level
// DATABASE_URL would still win if present.
config({ path: path.resolve(import.meta.dir, ".env") });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({
  adapter,
});

