import mongoose from "mongoose";
import { createClient } from 'redis';

// This file should only export connection logic, not execute it.

// Mongo connection function
async function connectMongo(uri) {    
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

// Redis connection function
async function connectRedis(config) {
    const client = createClient({
        username: 'default',
        password: config.REDIS_KEY,
        socket: {
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            connectTimeout: 5000
        }
    });

    client.on('error', err => console.log('Redis Client Error', err));
    await client.connect();
    return client;
}

// Export DB connections
export { mongoose, connectMongo, connectRedis };