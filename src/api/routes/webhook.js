/**
 * Encapsulates the routes for handling Stripe webhooks.
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
import Order from '../models/Order.js';
import { sendConfirmationEmail } from '../email.js'; // <-- Add this import

export default async function webhookRoutes(fastify, opts) {
  // This route must not parse the body as JSON. Stripe SDK needs the raw body to verify the signature.
  fastify.post('/stripe', { config: { rawBody: true } }, async (request, reply) => {
    const sig = request.headers['stripe-signature'];
    const endpointSecret = fastify.config.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      request.log.error('Stripe webhook secret (STRIPE_WEBHOOK_SECRET) is not configured.');
      return reply.code(500).send('Internal Server Error: Webhook secret not configured.');
    }

    let event;

    try {
      // Use the raw body to construct the event.
      event = fastify.stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret);
    } catch (err) {
      request.log.error({ err }, 'Stripe webhook signature verification failed.');
      return reply.code(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_succeeded': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        request.log.info({ orderId }, 'Payment was successful!');

        try {
          // Validate orderId
          if (!fastify.mongo.ObjectId.isValid(orderId)) {
            request.log.error({ orderId }, 'Invalid Order ID format.');
            return reply.code(400).send('Invalid Order ID format.');
          }

          // 1. Find the order in your database using `orderId`.
          const order = await Order.findOne({ _id: new fastify.mongo.ObjectId(orderId) });

          if (order) {
            // 2. Update the order status to 'paid' or 'processing'.
            order.status = 'processing'; // Or 'paid', depending on your workflow
            await order.save();

            // 3. Trigger email confirmation, shipping logic, etc.
            await sendConfirmationEmail(fastify, order.customerEmail, orderId); // <-- Use the imported function here
          } else {
            request.log.error({ orderId }, 'Order not found in database.');
          }
        } catch (err) {
          request.log.error({ err, orderId }, 'Error processing successful payment.');
        }
        break;
      }
      case 'payment_failed': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;
        const failureReason = paymentIntent.last_payment_error?.message;

        request.log.warn({ orderId, failureReason }, 'Payment failed.');

        try {
          // Validate orderId
          if (!fastify.mongo.ObjectId.isValid(orderId)) {
            request.log.error({ orderId }, 'Invalid Order ID format.');
            return reply.code(400).send('Invalid Order ID format.');
          }

          // 1. Find the order in your database using `orderId`.
          const order = await Order.findOne({ _id: new fastify.mongo.ObjectId(orderId) });

          if (order) {
            // 2. Update the order status to 'payment_failed'.
            order.status = 'payment_failed';
            await order.save();


            // 3. Optionally, notify the user that their payment failed.  You'll need to implement this.
            // fastify.email.sendPaymentFailedEmail(order.customerEmail, orderId, failureReason);
          } else {
            request.log.error({ orderId }, 'Order not found in database.');
          }
        } catch (err) {
          request.log.error({ err, orderId, failureReason }, 'Error processing failed payment.');
        }
        break;
      }
      // ... handle other event types
      default:
        request.log.info(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    reply.send({ received: true });
  });
}
