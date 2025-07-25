import fp from 'fastify-plugin';
import nodemailer from 'nodemailer';

async function mailerPlugin(fastify, options) {
    // Create a transporter object using the SMTP transport from your .env config
    const transporter = nodemailer.createTransport({
        host: fastify.config.SMTP_HOST,
        port: fastify.config.SMTP_PORT,
        secure: fastify.config.SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
            user: fastify.config.SMTP_USER,
            pass: fastify.config.SMTP_PASS,
        },
    });

    // Verify connection configuration on startup
    try {
        await transporter.verify();
        fastify.log.info('Mail transporter is ready');
    } catch (err) {
        fastify.log.error(err, 'Mail transporter failed to connect');
    }

    // Decorate the fastify instance with the transporter
    fastify.decorate('mailer', transporter);
}

export default fp(mailerPlugin);