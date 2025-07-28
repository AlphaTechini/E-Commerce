import fp from 'fastify-plugin';
import nodemailer from 'nodemailer';

/**
 * This plugin sets up and verifies the nodemailer transporter.
 * It uses async/await to handle the asynchronous verification process,
 * which prevents the 'plugin did not start in time' error.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function mailerPlugin(fastify, opts) {
    // 1. Create the nodemailer transporter with config from .env
    const transporter = nodemailer.createTransport({
        host: fastify.config.SMTP_HOST,
        port: fastify.config.SMTP_PORT,
        // Use `secure: true` for port 465, `false` for others (like 587 which uses STARTTLS).
        secure: fastify.config.SMTP_PORT === 465,
        auth: {

            user: fastify.config.SMTP_USER,
            pass: fastify.config.SMTP_PASS,
        },
    });

  try {
    // 2. Verify the connection. We `await` this promise to ensure Fastify waits.
    await transporter.verify();
    fastify.log.info('Mailer is ready to send emails.');
    // 3. Decorate the fastify instance with the mailer so it's available everywhere.
    fastify.decorate('mailer', transporter);
  } catch (error) {
    fastify.log.error(
      { err: error },
      'Mailer connection verification failed. Please check your SMTP settings.'
    );
    // Re-throw the original error to prevent the server from starting with a broken mailer
    // and to preserve the original stack trace for easier debugging.
    throw error;
  }
}

export default fp(mailerPlugin, { name: 'mailer', dependencies: ['@fastify/env'], timeout: 30000 });