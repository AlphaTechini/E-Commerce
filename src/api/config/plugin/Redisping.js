import fp from 'fastify-plugin';

const PING_INTERVAL_MS = 4 * 24 * 60 * 60 * 1000; // 4 days

async function redisPingPlugin(fastify, opts) {
  const { redis, log } = fastify;

  const schedulePing = () => {
    setTimeout(async () => {
      try {
        const payload = { app: 'my-web-app', owner: 'RAY', lastPing: new Date().toISOString() };
        await redis.set('keepalive:appPing', JSON.stringify(payload));
        log.info('Redis ping refreshed to keep free tier alive.');
      } catch (error) {
        log.error(error, 'Failed to refresh Redis ping.');
      } finally {
        // Schedule the next ping regardless of success or failure
        schedulePing();
      }
    }, PING_INTERVAL_MS);
  };

  // Start the first ping schedule
  schedulePing();
  log.info('Redis keep-alive pinger scheduled.');
}

export default fp(redisPingPlugin);
