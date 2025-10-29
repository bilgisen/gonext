// db/client.ts
// Load environment variables explicitly for Next.js compatibility
import { config } from 'dotenv';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@netlify/neon";

// Load environment variables safely (ignore isTTY errors)
try {
  config({ path: '.env.local' });
} catch (error) {
  // Silently ignore dotenv errors (Next.js might already have loaded env vars)
}

try {
  config({ path: '.env' });
} catch (error) {
  // Silently ignore dotenv errors
}

// More defensive environment variable check for Next.js
function getDatabaseUrl(): string {
  const url = process.env.NETLIFY_DATABASE_URL;

  if (!url) {
    // Try alternative environment variable names
    const altUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

    if (!altUrl) {
      throw new Error(
        "Database URL not found. Please set one of: NETLIFY_DATABASE_URL, DATABASE_URL, or NEON_DATABASE_URL in .env.local"
      );
    }

    return altUrl;
  }

  return url;
}

// Direct database initialization
const databaseUrl = getDatabaseUrl();
console.log('🔌 Connecting to database:', databaseUrl.replace(/\/\/.*@/, '//***:***@'));

const sql: any = neon(databaseUrl);
export const db = drizzle(sql);
console.log('✅ Database connected successfully');
