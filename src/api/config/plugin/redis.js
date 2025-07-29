import fp from 'fastify-plugin';
import Redis from 'ioredis';

/**
 * This plugin connects to Redis using ioredis and decorates the Fastify
 * instance with the client. It handles connection logic and graceful shutdown.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function redisPlugin(fastify, opts) {
  const { config, log } = fastify;
  const redisClient = new Redis({
    port: config.REDIS_PORT,
    host: config.REDIS_HOST,
    password: config.REDIS_KEY,
    connectTimeout: 5000,
    // Do not retry individual commands on failure; let the connection retry instead.
    maxRetriesPerRequest: null,
    // Prevent commands from queuing up when the connection is lost during startup.
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 5) {
        log.error('Redis connection failed after 5 retries. Stopping.');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 100, 2000);
      log.warn(`Redis connection attempt ${times} failed. Retrying in ${delay}ms...`);
      return delay;
    },
  });

  redisClient.on('error', (err) => log.error(err, 'A Redis client error occurred.'));

  try {
    // Wait for the client to be 'ready' before considering the plugin loaded.
    await new Promise((resolve, reject) => {
      redisClient.once('ready', () => {
        log.info('Redis plugin connected successfully.');
        resolve();
      });

      // This listener will catch the initial connection error if the retryStrategy gives up.
      redisClient.once('error', (err) => {
        log.error(err, 'Initial Redis connection failed.');
        redisClient.quit(); // Ensure client is closed to prevent hanging.
        reject(err);
      });
    });

    fastify.decorate('redis', redisClient);

    // Gracefully close the connection on server shutdown.
    fastify.addHook('onClose', (instance, done) => {
      instance.redis.quit(() => {
        instance.log.info('Redis connection closed.');
        done();
      });
    });
  } catch (err) {
    log.error({ err }, 'Redis plugin setup failed. The server will not start.');
    // Re-throw the error to prevent the server from starting with a broken Redis connection.
    throw err;
  }
}

export default fp(redisPlugin, {
  name: 'redis',
  dependencies: ['@fastify/env'],
});