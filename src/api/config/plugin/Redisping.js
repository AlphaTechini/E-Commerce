import fp from 'fastify-plugin';

const PING_INTERVAL_MS = 4 * 24 * 60 * 60 * 1000; // 4 days
const KEEPALIVE_KEY = 'keepalive:appPing';

/**
 * This plugin periodically pings a Redis instance to prevent it from being
 * deleted due to inactivity on free hosting tiers.
 * It intelligently schedules the first ping based on the last known ping time.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function redisPingPlugin(fastify, opts) {
  const { redis, log } = fastify;
  let timeoutId = null; // To hold the timeout ID for cleanup

  // A recurring function that pings Redis and schedules the next ping.
  const pingAndReschedule = async () => {
    try {
      const payload = { app: 'my-web-app', owner: 'RAY', lastPing: new Date().toISOString() };
      await redis.set(KEEPALIVE_KEY, JSON.stringify(payload));
      log.info('Redis ping refreshed to keep free tier alive.');
    } catch (error) {
      log.error(error, 'Failed to refresh Redis ping.');
    } finally {
      // Always schedule the next ping for the full interval.
      timeoutId = setTimeout(pingAndReschedule, PING_INTERVAL_MS);
    }
  };

  const initializePinger = async () => {
    let initialDelay = 0; // Default to pinging immediately.

    try {
      const lastPingData = await redis.get(KEEPALIVE_KEY);
      if (lastPingData) {
        const { lastPing } = JSON.parse(lastPingData);
        const lastPingTime = new Date(lastPing).getTime();
        const timeSinceLastPing = Date.now() - lastPingTime;

        if (timeSinceLastPing < PING_INTERVAL_MS) {
          // Last ping was recent, schedule the next one after the remaining time.
          initialDelay = PING_INTERVAL_MS - timeSinceLastPing;
          const hoursRemaining = Math.round(initialDelay / (1000 * 60 * 60));
          log.info(`Redis keep-alive ping is recent. Next ping in ~${hoursRemaining} hours.`);
        } else {
          log.info('Last Redis keep-alive ping is stale. Pinging immediately.');
        }
      } else {
        log.info('No previous Redis keep-alive ping found. Pinging immediately.');
      }
    } catch (error) {
      log.error(error, 'Could not check last Redis ping time. Pinging immediately just in case.');
    }

    // Schedule the first ping. Subsequent pings are handled by pingAndReschedule itself.
    timeoutId = setTimeout(pingAndReschedule, initialDelay);
    log.info('Redis keep-alive pinger has been initialized.');
  };

  // Start the pinger initialization process.
  initializePinger();

  // Add a hook to clean up the timer on server shutdown.
  fastify.addHook('onClose', (instance, done) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    done();
  });
}

export default fp(redisPingPlugin, {
  name: 'redis-ping',
  dependencies: ['redis'] // Assumes a 'redis' plugin is registered
});
