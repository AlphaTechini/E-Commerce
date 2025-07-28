import mongoose from "mongoose";
import Redis from 'ioredis';

// This file exports functions that handle connecting to my databases.
// I'm keeping the connection logic separate from the main app setup for better organization.

// Mongo connection function
async function connectMongo(uri) {    
    // The serverSelectionTimeoutMS option tells Mongoose to stop trying to connect
    // after 5 seconds if it can't find a server. This prevents the app from hanging indefinitely.
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

// Redis connection function
async function connectRedis(config) {
    // ioredis uses a direct options object for configuration.
    // It also handles reconnections automatically.
    const client = new Redis({
        port: config.REDIS_PORT,
        host: config.REDIS_HOST,
        password: config.REDIS_KEY,
        connectTimeout: 5000,
        // It's good practice to prevent ioredis from endlessly retrying on a single command
        // if the connection is down during that command.
        maxRetriesPerRequest: null
    });

    // This is an event listener. If Redis has a connection error at any point while the app is running,
    // it will log it to the console.
    client.on('error', err => console.error('Redis Client Error', err));
    // ioredis connects lazily. We can ping to ensure the connection is live before proceeding.
    await client.ping();
    return client;
}

// Export DB connections
export { connectMongo, connectRedis };