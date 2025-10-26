import { getStore as getNetlifyStore } from '@netlify/blobs';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

// Type-safe store configuration
type StoreConfig = {
  name: string;
  siteID?: string;
  token?: string;
  apiURL?: string;
  edge?: boolean;
};

// Base configuration that works in both environments
const baseConfig: Omit<StoreConfig, 'name'> = {
  edge: true, // Enable edge-optimized mode
};

// Add environment-specific configuration
if (process.env.NETLIFY) {
  // In Netlify environment, use environment variables
  baseConfig.apiURL = process.env.URL;
} else {
  // In local development, use local configuration
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  
  if (!siteID || !token) {
    console.warn('Warning: Missing NETLIFY_SITE_ID or NETLIFY_AUTH_TOKEN in local environment. Blob storage may not work correctly.');
    // Don't throw error during module loading, let it fail gracefully when actually used
  } else {
    baseConfig.siteID = siteID;
    baseConfig.token = token;
  }

  baseConfig.apiURL = process.env.URL || 'http://localhost:8888';
}

/**
 * Get a Netlify store instance that works in both local and Netlify environments
 */
export function getNewsStore() {
  // Check if we have the required credentials when actually trying to use the store
  if (!process.env.NETLIFY && (!baseConfig.siteID || !baseConfig.token)) {
    throw new Error('Missing NETLIFY_SITE_ID or NETLIFY_AUTH_TOKEN in local environment. Please check your .env.local file.');
  }

  return getNetlifyStore({
    ...baseConfig,
    name: 'news-images',
  });
}
