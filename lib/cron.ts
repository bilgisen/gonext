// lib/cron.ts
import { CronJob } from 'cron';
import redis from './redis';

const syncTrending = async () => {
  try {
    console.log('Starting trending sync job (archive only)...');
    const periods = ['daily', 'weekly', 'monthly'];
    
    for (const period of periods) {
      console.log(`Archiving ${period} trends...`);
      const trending = await redis.zrevrange(`trending:${period}`, 0, -1, 'WITHSCORES');
      
      if (trending.length === 0) {
        console.log(`No data to archive for ${period}`);
        continue;
      }

      // Archive the current scores before resetting
      const timestamp = Date.now();
      const archiveKey = `trending:${period}:${timestamp}`;
      await redis.rename(`trending:${period}`, archiveKey);
      
      // Keep only the last 7 archives to prevent unlimited growth
      const archives = await redis.keys(`trending:${period}:*`);
      if (archives.length > 7) {
        // Sort by timestamp (oldest first) and remove the oldest
        const sortedArchives = archives.sort((a, b) => {
          // Extract timestamp from key name (format: trending:period:timestamp)
          const timeA = parseInt(a.split(':').pop() || '0', 10);
          const timeB = parseInt(b.split(':').pop() || '0', 10);
          return timeA - timeB; // Ascending order (oldest first)
        });
        const toDelete = sortedArchives.slice(0, Math.max(0, archives.length - 7));
        if (toDelete.length > 0) {
          await redis.del(...toDelete);
          console.log(`Deleted ${toDelete.length} old archives for ${period}`);
        }
      }
      
      console.log(`Archived ${trending.length / 2} ${period} trends to ${archiveKey}`);
    }
    
    console.log('Trending sync (archive) completed');
  } catch (error) {
    console.error('Error in trending sync job (archive):', error);
  }
};

// Schedule the job to run daily at 3 AM
const job = new CronJob(
  '0 3 * * *', // Every day at 3 AM
  syncTrending,
  null,
  false, // Don't start the job automatically
  'Europe/Istanbul' // Timezone
);

// Export the sync function for manual triggering if needed
export { syncTrending };

// Start the job in production
if (process.env.NODE_ENV === 'production') {
  job.start();
  console.log('Trending sync job (archive only) scheduled');
}