import fastify from 'fastify';
import nodemailer from 'nodemailer';

/**
 * Utility functions for sending emails related to payment notifications.
 */

/**
 * Sends a confirmation email to the customer after a successful payment.
 * @param {object} fastify - The Fastify instance (for mailer, config, and logging).
 * @param {string} to - The recipient's email address.
 * @param {string} orderId - The ID of the order.
 */
async function sendConfirmationEmail(fastify, to, orderId) {
  try {
    // Define the email message.
    await fastify.mailer.sendMail ({
      from: fastify.config.SMTP_FROM,
      to: to,
      subject: `Order Confirmation - Order ID: ${orderId}`,
      html: `<p>Thank you for your order! Your order ID is <b>${orderId}</b>.</p>`,
    });

    fastify.log.info(`Confirmation email sent to ${to} for order ${orderId}`);
  } catch (error) {
    fastify.log.error('Error sending confirmation email:', error);
    // Optionally, rethrow or handle error as needed
  }
}

export { sendConfirmationEmail };


