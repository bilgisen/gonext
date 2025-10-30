import type { Handler } from '@netlify/functions';
import { promisify } from 'util';
import { join } from 'path';

const exec = promisify(require('child_process').exec);

const handler: Handler = async () => {
  try {
    console.log('Starting news fetch job...');
    
    // Get the absolute path to the news-fetch-cli.ts script
    const scriptPath = join(process.cwd(), 'scripts', 'news-fetch-cli.ts');
    
    // Run the news fetch script using tsx
    const { stdout, stderr } = await exec(`npx tsx ${scriptPath}`);
    
    if (stderr) {
      console.error('Error in news fetch job:', stderr);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          success: false, 
          error: stderr,
          message: 'News fetch job failed'
        }),
      };
    }
    
    console.log('News fetch job completed successfully:', stdout);
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'News fetch job completed successfully',
        output: stdout 
      }),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in news fetch job:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: errorMessage,
        message: 'News fetch job failed with error'
      }),
    };
  }
};

// Schedule to run every 15 minutes
export const config = {
  schedule: '*/15 * * * *',  // Every 15 minutes
  // Alternatively, you can use the human-readable format:
  // schedule: '@every 15m'
};

export { handler };
