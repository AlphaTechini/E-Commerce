import mongoose from "mongoose";
import { createClient } from 'redis';

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
    // I'm creating a new Redis client using the credentials from my .env file.
    // The config object is passed in from app.js after it's been loaded.
    const client = createClient({
        username: 'default',
        password: config.REDIS_KEY,
        socket: {
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            connectTimeout: 5000
        }
    });

    // This is an event listener. If Redis has a connection error at any point while the app is running,
    // it will log it to the console.
    client.on('error', err => console.error('Redis Client Error', err));
    await client.connect();
    return client;
}

// Export DB connections
export { mongoose, connectMongo, connectRedis };