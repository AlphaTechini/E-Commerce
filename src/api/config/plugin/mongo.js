import fp from 'fastify-plugin';
import mongoose from 'mongoose';

/**
 * This plugin connects to MongoDB using Mongoose and decorates the
 * Fastify instance with the mongoose object.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function mongoPlugin(fastify, opts) {
    try {
        mongoose.connection.on('connected', () => fastify.log.info('Mongoose connected to DB.'));
        mongoose.connection.on('error', (err) => fastify.log.error(err, 'Mongoose connection error:'));
        mongoose.connection.on('disconnected', () => fastify.log.info('Mongoose disconnected.'));

        await mongoose.connect(fastify.config.MONGO_URI, { serverSelectionTimeoutMS: 7000 });

        fastify.addHook('onClose', (instance, done) => {
            mongoose.connection.close(false).then(() => {
                instance.log.info('Mongoose connection closed.');
                done();
            }).catch(err => {
                instance.log.error(err, 'Error closing Mongoose connection.');
                done();
            });
        });
    } catch (err) {
        fastify.log.error(err, 'Mongoose connection failed during startup.');
        throw err;
    }
}

export default fp(mongoPlugin, {
    name: 'mongo',
    dependencies: ['@fastify/env'],
});