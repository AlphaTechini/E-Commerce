import User from '../../models/User.js';
import crypto from 'crypto';

export default async function (fastify, opts) {
    const forgotPasswordSchema = {
        body: {
            type: 'object',
            required: ['email'],
            properties: {
                email: { type: 'string', format: 'email' }
            }
        }
    };

    fastify.post('/forgot-password', { schema: forgotPasswordSchema }, async (request, reply) => {
        try {
            const { email } = request.body;

            const existingUser = await User.findOne({email});

            // Only proceed if the user actually exists to avoid sending unnecessary emails
            // and creating tokens for non-existent users.
            if (existingUser) {
                // 1. Generate a secure, unique token
                const token = crypto.randomBytes(32).toString('hex');

                // 2. Store the token in Redis with the user's email, expiring in 15 minutes
                await fastify.redis.set(`reset:${token}`, email, { EX: 900 }); // 900 seconds = 15 minutes

                // 3. Create the password reset link for the frontend
                // This should point to your frontend page that handles password resets.
                // The frontend page will then make a POST request to the /api/new-password/:token endpoint.
                const resetLink = `${fastify.config.APP_URL}/reset-password/${token}`;

                await fastify.mailer.sendMail({
                    from: fastify.config.SMTP_FROM,
                    to: email,
                    subject: "Password Reset Request",
                    html: `
                        <p>You requested a password reset. Click the button below to set a new password:</p>
                        <p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#003366;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold;">Reset Password</a></p>
                        <p style="margin-top:32px;color:#555;font-size:14px;">This link will expire in 15 minutes. If you did not request this, you can safely ignore this email.</p>
                    `
                });
            }

            // Always send a generic success message to prevent user enumeration attacks.
            return reply.send({ message: "If an account with that email exists, a password reset link has been sent." });
        } catch (error) {
            fastify.log.error(error, "Forgot password request failure");
            return reply.code(500).send({error: "Could not process request"});
        }
    })
}