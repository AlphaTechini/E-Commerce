import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import auth from '@fastify/auth';
import rateLimit from '@fastify/rate-limit';
import fastifyEnv from '@fastify/env';

import { connectMongo, connectRedis } from './config/database.js';
import routes from './routes/index.js';
import cartRoutes from './routes/cart/index.js';
import productRoutes from './routes/products/index.js';
import orderRoutes from './routes/orders/index.js';
import mailerPlugin from './plugins/mailer.js';
import redisPingPlugin from './config/plugin/Redisping.js';

//Initialize fastify
const app = Fastify({
    logger: true
});

//Environment variables configuration
const envSchema = {
    type: 'object',
    required: [ 'PORT', 'MONGO_URI', 'REDIS_KEY', 'REDIS_HOST', 'REDIS_PORT', 'JWT_KEY', 'APP_URL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM' ],
    properties: {
        PORT: { type: 'string', default: '3000'},
        MONGO_URI: { type: 'string'},
        REDIS_KEY: { type: 'string' },
        REDIS_HOST: { type: 'string' },
        REDIS_PORT: { type: 'string' },
        JWT_KEY: { type: 'string' },
        APP_URL: { type: 'string' },
        SMTP_HOST: { type: 'string' },
        SMTP_PORT: { type: 'number' },
        SMTP_USER: { type: 'string' },
        SMTP_PASS: { type: 'string' },
        SMTP_FROM: { type: 'string' },
        ARGON2_MEMORY_COST: { type: 'number'},
        ARGON2_TIME_COST: { type: 'number'},
        ARGON2_PARALLELISM: { type: 'number'}
    }
};

app.register (fastifyEnv, {
    confKey: 'config',
    schema: envSchema,
    dotenv: true
});

// Use the `after` hook to ensure `fastify-env` has loaded the config
app.after(async (err) => {
    if (err) {
        app.log.error(err);
        return;
    }
    try {
        // Connect to MongoDB
        await connectMongo(app.config.MONGO_URI);
        app.log.info('MongoDB connected successfully.');
        // Connect to Redis and decorate the fastify instance with the client
        const redisClient = await connectRedis(app.config);
        app.decorate('redis', redisClient);
        app.log.info('Redis connected successfully.');
    } catch (dbErr) {
        app.log.error(dbErr, 'Database connection error');
        process.exit(1);
    }

    // Register JWT plugin using config
    app.register(jwt, {
        secret: app.config.JWT_KEY
    });

    // Register mailer plugin
    app.register(mailerPlugin);

    // Register Redis keep-alive pinger
    app.register(redisPingPlugin);

    // Register rate-limit plugin using Redis for a global limit
    app.register(rateLimit, {
        max: 40, // max requests per timeWindow
        timeWindow: '1 minute',
        redis: app.redis // use the redis client decorated to the fastify instance
    });

    // Register routes after plugins and DB connections are set up
    app.register(routes, { prefix: '/api' });
    app.register(cartRoutes, { prefix: '/api' });
    app.register(productRoutes, { prefix: '/api' });
    app.register(orderRoutes, { prefix: '/api/orders' });
});

app.register(cors);
app.register(helmet);
app.register(sensible);
app.register(auth);

export default app;