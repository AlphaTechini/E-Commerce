import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import auth from '@fastify/auth';
import rateLimit from '@fastify/rate-limit';
import fastifyEnv from '@fastify/env';
import AutoLoad from '@fastify/autoload';

import redisPlugin from './config/plugin/redis.js';
import mongoPlugin from './config/plugin/mongo.js';
import mailerPlugin from './config/plugin/mailer.js';
import redisPingPlugin from './config/plugin/Redisping.js';

//Initialize fastify
const app = Fastify({
    logger: true
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Plugin Registration ---
// The order of registration is crucial for Fastify applications.

// 1. Register essential utility plugins that have no dependencies on others.
app.register(cors);
app.register(helmet); // Important for security, should be registered early.
app.register(sensible); // Provides useful http error utilities.
app.register(auth); // Provides authentication hooks framework.

// 2. Define the schema for environment variables.
const envSchema = {
    type: 'object',
    required: [ 'PORT', 'MONGO_URI', 'REDIS_KEY', 'REDIS_HOST', 'REDIS_PORT', 'JWT_KEY', 'APP_URL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM' ],
    properties: {
        PORT: { type: 'number', default: '8000'},
        MONGO_URI: { type: 'string'},
        REDIS_KEY: { type: 'string' },
        REDIS_HOST: { type: 'string' },
        REDIS_PORT: { type: 'number' },
        JWT_KEY: { type: 'string' },
        APP_URL: { type: 'string' },
        SMTP_HOST: { type: 'string' },
        SMTP_PORT: { type: 'number' },
        SMTP_USER: { type: 'string' },
        SMTP_PASS: { type: 'string' },
        SMTP_FROM: { type: 'string' },
        ARGON2_MEMORY_COST: { type: 'number'},
        ARGON2_TIME_COST: { type: 'number'},
        ARGON2_PARALLELISM: { type: 'number'},
        ADMIN_ROUTE: { type: 'string'}
    }
};

// 3. Register the environment variable plugin. It loads config needed by other plugins.
app.register(fastifyEnv, {
    confKey: 'config',
    schema: envSchema,
    dotenv: {
        path: path.join(__dirname, '../../.env')
    }
});

// 4. Use the `after` hook to register plugins that depend on the loaded environment config.
// This ensures `app.config` is available for all subsequent registrations.
app.after(async (err) => {
    if (err) {
        app.log.error(err);
        return;
    }

    // Register JWT plugin, which depends on the JWT_KEY from config.
    app.register(jwt, {
        secret: app.config.JWT_KEY
    });

    // Decorate the instance with a generic authentication hook for all logged-in users.
    // This can be used on any route that requires a user to be authenticated.
    app.decorate('verifyJWT', async function (request, reply) {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    // Decorate the instance with an authentication hook for admin users
    app.decorate('verifyAdmin', async function (request, reply) {
        try {
            // First, ensure the user is authenticated
            await request.jwtVerify();
            // Then, check if the authenticated user is an admin
            if (request.user.role !== 'admin') {
                return reply.code(403).send({ error: 'Forbidden: Admin access required.' });
            }
        } catch (err) {
            // Catch errors from jwtVerify (e.g., no token, invalid token) and send a generic response.
            return reply.code(401).send({ error: 'Authentication required.' });
        }
    });

    // Register plugins that have dependencies.
    // The 'redis' plugin MUST be registered before any plugin that depends on it.
    // The 'mongo' plugin handles the MongoDB connection.
    app.register(mongoPlugin);
    app.register(redisPlugin);

    // Register plugins that depend on the redis client being available.
    app.register(rateLimit, {
        max: 40, // max requests per timeWindow
        timeWindow: '1 minute',
        redis: app.redis // Natively supported by @fastify/rate-limit with ioredis
    });
    app.register(redisPingPlugin); // Now this will find its 'redis' dependency.

    // Register other independent plugins
    app.register(mailerPlugin); // Depends on 'env'

    // 5. Automatically load all routes from the 'routes' directory.
    // This should be done last so routes have access to all decorators and plugins.
    app.register(AutoLoad, {
        dir: path.join(__dirname, 'routes'),
        options: { prefix: '/api' },
        dirNameRoutePrefix: false
    });
});
export default app;