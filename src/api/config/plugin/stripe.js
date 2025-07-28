import fp from 'fastify-plugin';
import Stripe from 'stripe';

/**
 * This plugin initializes the Stripe SDK and decorates the Fastify instance.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function stripePlugin(fastify, opts) {
  // Check if the Stripe secret key is present in the environment config.
  if (!fastify.config.STRIPE_SECRET_KEY) {
    fastify.log.error('Stripe secret key (STRIPE_SECRET_KEY) is not configured.');
    // Throw an error to prevent the server from starting without a valid Stripe configuration.
    throw new Error('Stripe secret key is missing.');
  }

  // Initialize the Stripe client with the secret key.
  const stripe = new Stripe(fastify.config.STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10', // It's a best practice to pin the API version.
  });

  fastify.log.info('Stripe plugin loaded and client initialized.');

  // Decorate the fastify instance with the Stripe client.
  fastify.decorate('stripe', stripe);
}

// Export the plugin with its dependencies.
export default fp(stripePlugin, {
  name: 'stripe',
  dependencies: ['@fastify/env'],
});