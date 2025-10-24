import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@netlify/neon";
import * as schema from "./schema";

// TypeScript'teki küçük farkları bypass etmek için 'any' cast'i
const sql: any = neon();

export const db = drizzle(sql, { schema });
