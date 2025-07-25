// filepath: c:\E-Commerce\src\api\server.js
import app from './app.js';

const start = async () => {
    try {
        await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
        console.log('Server running...');
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();