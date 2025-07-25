import User from "../../models/User.js";

export default async function (fastify, opts) {
    const verifySchema = {
        querystring: {
            type: 'object',
            required: ['token'],
            properties: {
                token: { type: 'string', pattern: '^[a-f0-9]{64}$' } // Ensures token is a 64-char hex string
            }
        }
    };

    fastify.get('/verify-email', { schema: verifySchema }, async (request, reply) => {
        try {
            const { token } = request.query;

            // Atomically get and delete the token to prevent race conditions
            const userDataJSON = await fastify.redis.getDel(`verify:${token}`);
            if (!userDataJSON) {
                return reply.code(400).send({ error: "Verification link expired or invalid" });
            }

            const { username, email, password } = JSON.parse(userDataJSON);

            // Create the user in the database
            await User.create({ username, email, password, isVerified: true });

            // Clean up the secondary unverified email key
            await fastify.redis.del(`unverified-email:${email}`);

            reply.send({ message: "Email verified and user registered. Login to access your account" });
        } catch (error) {
            // Handle potential duplicate key error from MongoDB (error code 11000)
            if (error.code === 11000) {
                return reply.code(409).send({ error: "This email or username is already registered." });
            }
            fastify.log.error(error, "Error during user creation from verification link");
            return reply.code(500).send({ error: "An error occurred during registration." });
        }
    });
}
