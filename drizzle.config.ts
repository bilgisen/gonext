import { defineConfig } from "drizzle-kit";
import { config } from 'dotenv';

// Load environment variables for drizzle-kit
try {
  config({ path: '.env.local' });
} catch (error) {
  // Silently ignore
}

try {
  config({ path: '.env' });
} catch (error) {
  // Silently ignore
}

// Get the database URL from environment
const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Database URL not found. Please set NETLIFY_DATABASE_URL or DATABASE_URL in .env.local"
  );
}

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});