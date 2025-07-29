// filepath: c:\E-Commerce\src\api\server.js
import app from './app.js';

const start = async () => {
    try {
        // We must wait for the app to be "ready" before we can access `app.config`.
        // The `app.ready()` function loads all registered plugins, including `@fastify/env`.
        await app.ready();
        // Now that plugins are loaded, `app.config.PORT` is available.
        await app.listen({ port: app.config.PORT, host: '0.0.0.0' });
    } catch (err) {
        if (err.code === 'EADDRINUSE') {
            app.log.error(`Port ${err.port} is already in use. Please stop the conflicting process or change the port.`);
        } else {
            app.log.error(err);
        }
        process.exit(1);
    }
};

start();