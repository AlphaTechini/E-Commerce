import argon2 from 'argon2';
import User from '../../models/User.js'

export default async function (fastify, opts) {
    const changePasswordSchema = {
        body: {
            type: 'object',
            required: ['oldPassword', 'newPassword', 'confirmNewPass'],
            properties: {
                oldPassword: {type: 'string', minLength: 8},
                newPassword: {type: 'string', minLength: 8},
                confirmNewPass: {type: 'string', minLength: 8}
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            }
        }
    };

    fastify.post('/change-password', {
        onRequest: [fastify.authenticate], // Ensure the user is authenticated
        schema: changePasswordSchema
    }, async (request, reply) => {
        try {
            const { oldPassword, newPassword, confirmNewPass } = request.body;
            const { userId } = request.user; // Get user ID from JWT payload

            const existingUser = await User.findById(userId);
            if (!existingUser) {
                return reply.code(404).send({ error: "User not found" });
            }
            
            const isMatch = await argon2.verify(existingUser.password, oldPassword);
            if(!isMatch) {
                 return reply.code(401).send({error: "Incorrect old password"});
            }

            if (newPassword !== confirmNewPass) {
                return reply.code(400).send({error: "New passwords do not match"});
            }

            if (oldPassword === newPassword) {
                return reply.code(400).send({ error: "New password cannot be the same as the old password." });
            }
            
            const newHashedPassword = await argon2.hash(newPassword, {
                type: argon2.argon2id,
                memoryCost: fastify.config.ARGON2_MEMORY_COST,
                timeCost: fastify.config.ARGON2_TIME_COST,
                parallelism: fastify.config.ARGON2_PARALLELISM,
            });
            await User.findOneAndUpdate(
             { _id: userId },
             {password: newHashedPassword}
            );
            return reply.send({ message: "Password updated successfully." });
        } catch (error) {
          fastify.log.error(error, "Password update failure");
          return reply.code(500).send({error: "Could not update password"});
        }
    })
}