import 'dotenv/config'; // Load environment variables
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@netlify/neon";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// TypeScript'teki küçük farkları bypass etmek için 'any' cast'i
const sql: any = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
