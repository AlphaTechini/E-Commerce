/**
 * Encapsulates the routes for payment handling.
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
export default async function paymentRoutes(fastify, opts) {
  fastify.post('/create-intent', {
    schema: {
      body: {
        type: 'object',
        required: ['amount', 'currency'],
        properties: {
          // Stripe requires amount in the smallest currency unit (e.g., cents).
          // Minimum is 50 for USD (i.e., $0.50).
          amount: { type: 'integer', minimum: 50 },
          currency: { type: 'string', pattern: '^[a-z]{3}$' }, // e.g., 'usd'
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            clientSecret: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { amount, currency } = request.body;

    try {
      // Create a PaymentIntent with the order amount and currency.
      const paymentIntent = await fastify.stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        automatic_payment_methods: { enabled: true },
      });

      // Send the client secret back to the client.
      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      request.log.error({ err: error }, 'Stripe PaymentIntent creation failed.');
      reply.code(500).send({ error: 'Internal Server Error: Could not create payment intent.' });
    }
  });
}