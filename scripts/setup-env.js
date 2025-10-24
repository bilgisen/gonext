#!/usr/bin/env node

/**
 * Environment Setup Script
 *
 * Bu script'i çalıştırarak .env dosyasını oluşturabilirsiniz:
 * node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔧 Environment Setup for GoNext News Fetcher\n');

  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️ .env file already exists!');
    const overwrite = await question('Overwrite existing .env file? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Read .env.example
  let envContent = '';
  try {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  } catch (error) {
    console.log('📝 Creating default .env content...');
    envContent = `# News API Configuration
NEWS_API_URL=https://goen.onrender.com/api/v1/news

# Logging Configuration
LOG_LEVEL=1  # 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR

# Database Configuration (add your Neon DB URL)
# DATABASE_URL=

# Netlify Configuration (for image uploads)
# NETLIFY_BLOBS_ACCESS_TOKEN=

# Rate Limiting (optional)
# API_RATE_LIMIT=50  # requests per minute
# BATCH_DELAY=2000  # milliseconds between batches
`;
  }

  // Ask for database URL
  console.log('\n📊 Database Configuration:');
  const databaseUrl = await question('Enter your Neon DATABASE_URL: ');

  if (databaseUrl.trim()) {
    // Replace placeholder with actual URL
    envContent = envContent.replace(/# DATABASE_URL=/, `DATABASE_URL=${databaseUrl}`);
  } else {
    // Use default if provided
    envContent = envContent.replace(/# DATABASE_URL=your_neon_database_url/, `DATABASE_URL=postgresql://neondb_owner:npg_kYNXp2z8xQSa@ep-small-bread-aexnzn73-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require`);
  }

  // Ask for API URL
  console.log('\n🌐 API Configuration:');
  const apiUrl = await question('Enter NEWS_API_URL (default: https://goen.onrender.com/api/v1/news): ');

  if (apiUrl.trim()) {
    envContent = envContent.replace(/NEWS_API_URL=.*/, `NEWS_API_URL=${apiUrl}`);
  }

  // Ask for log level
  console.log('\n📝 Logging Configuration:');
  const logLevel = await question('Enter LOG_LEVEL 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR (default: 1): ');

  if (logLevel.trim() && !isNaN(parseInt(logLevel))) {
    envContent = envContent.replace(/LOG_LEVEL=.*/, `LOG_LEVEL=${logLevel}`);
  }

  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('📍 Location:', envPath);
    console.log('\n🚀 You can now run:');
    console.log('   npm run test:news');
    console.log('   npm run news:fetch');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
  }

  rl.close();
}

main().catch((error) => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});
