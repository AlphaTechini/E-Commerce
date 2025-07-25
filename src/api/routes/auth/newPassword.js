import User from '../../models/User.js';
import argon2 from 'argon2';

export default async function (fastify, opts) {
    const newPasswordSchema = {
        body: {
            type: 'object',
            required: ['newPassword', 'confirmNewPassword'],
            properties: {
                newPassword: { type: 'string', minLength: 8 },
                confirmNewPassword: { type: 'string', minLength: 8 }
            }
        },
        params: {
            type: 'object',
            required: ['token'],
            properties: {
                token: { type: 'string', pattern: '^[a-f0-9]{64}$' } // Ensures token is a 64-char hex string
            }
        }
    };

    fastify.post('/new-password/:token', { schema: newPasswordSchema }, async (request, reply) => {
        try {
            const { token } = request.params;
            const { newPassword, confirmNewPassword } = request.body;

            if (newPassword !== confirmNewPassword) {
                return reply.code(400).send({ error: 'Passwords do not match.' });
            }

            // 1. Atomically get and delete the token from Redis to prevent race conditions.
            // This assumes your /forgot-pass route stores a token like 'reset:<token>' -> 'user@example.com'.
            const email = await fastify.redis.getDel(`reset:${token}`);
            if (!email) {
                return reply.code(400).send({ error: 'Password reset token is invalid or has expired.' });
            }

            // 2. Hash the new password
            const newHashedPassword = await argon2.hash(newPassword, {
                type: argon2.argon2id,
                memoryCost: fastify.config.ARGON2_MEMORY_COST,
                timeCost: fastify.config.ARGON2_TIME_COST,
                parallelism: fastify.config.ARGON2_PARALLELISM,
            });

            // 3. Update the user's password in the database
            const updatedUser = await User.findOneAndUpdate(
                { email },
                { password: newHashedPassword }
            );

            if (!updatedUser) {
                return reply.code(404).send({ error: 'User associated with this token not found.' });
            }

            return reply.send({ message: 'Your password has been reset successfully.' });
        } catch (error) {
          fastify.log.error(error, 'Password reset failure');
          return reply.code(500).send({ error: 'Could not reset password.' });
        }
    });
}