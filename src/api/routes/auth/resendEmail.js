import crypto from "crypto";
import User from "../../models/User.js";

export default async function (fastify, opts) {
    const resendSchema = {
        body: {
            type: 'object',
            required: ['email'],
            properties: {
                email: { type: 'string', format: 'email' }
            }
        }
    };

    fastify.post('/resend-email', { schema: resendSchema }, async (request, reply) => {
        try {
            const { email } = request.body;

            // 1. Check if the user is already verified and exists in the main collection.
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return reply.code(409).send({ error: "This email address has already been verified. Please log in." });
            }

            // 2. Look for the old token associated with this email in Redis.
            const oldToken = await fastify.redis.get(`unverified-email:${email}`);
            if (!oldToken) {
                return reply.code(404).send({ error: "No pending verification found for this email. The original registration may have expired. Please sign up again." });
            }

            // 3. Retrieve the original user data using the old token.
            const userDataJSON = await fastify.redis.get(`verify:${oldToken}`);
            if (!userDataJSON) {
                // This is an inconsistent state, but we should handle it.
                // The email->token mapping exists, but the token->data mapping doesn't.
                // Clean up the stale email mapping.
                await fastify.redis.del(`unverified-email:${email}`);
                return reply.code(404).send({ error: "No pending verification found for this email. The original registration may have expired. Please sign up again." });
            }
            const userData = JSON.parse(userDataJSON);

            // 4. Generate a new token and update Redis.
            const newToken = crypto.randomBytes(32).toString('hex');

            // Use a transaction to ensure atomicity of Redis operations
            const multi = fastify.redis.multi();
            multi.del(`verify:${oldToken}`);
            multi.del(`unverified-email:${email}`);
            multi.set(`verify:${newToken}`, JSON.stringify(userData), { EX: 420 }); // 7 minutes
            multi.set(`unverified-email:${email}`, newToken, { EX: 420 }); // 7 minutes
            await multi.exec();

            // 5. Send the new verification email.
            const verificationLink = `${fastify.config.APP_URL}/api/verify-email?token=${newToken}`;

            await fastify.mailer.sendMail({
                from: fastify.config.SMTP_FROM,
                to: email,
                subject: "Verify your email (New Link)",
                html: `
                    <p>Here is your new verification link. Please click the button below to verify your email:</p>
                    <p>
                        <a href="${verificationLink}"
                           style="display:inline-block;padding:12px 24px;background:#003366;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold;">
                            Verify email
                        </a>
                    </p>
                    <p style="margin-top:32px;color:#555;font-size:14px;">
                        If you did not request this, you can safely ignore this email.
                    </p>
                `
            });
            reply.send({ message: "A new verification email has been sent. Please check your inbox." });

        } catch (error) {
            fastify.log.error(error, "Error during resend verification email process");
            return reply.code(500).send({ error: "An internal error occurred. Please try again later." });
        }
    });
}
