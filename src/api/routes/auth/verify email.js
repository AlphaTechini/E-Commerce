import User from "../../models/User.js";

// This is the final step of the signup process.
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

            // I'm using `getDel` here, which is an atomic "get and then delete" operation from Redis.
            // This is a crucial security step to prevent the same verification link from being used twice (a race condition).
            const userDataJSON = await fastify.redis.getDel(`verify:${token}`);
            if (!userDataJSON) {
                // If the key doesn't exist, it means the token is either wrong or has expired.
                return reply.code(400).send({ error: "Verification link expired or invalid" });
            }

            // The user data was stored as a JSON string in Redis, so I need to parse it back into an object.
            const { username, email, password } = JSON.parse(userDataJSON);

            // Now that the email is verified, I can create the permanent user record in MongoDB.
            // The password is already hashed from the signup step.
            await User.create({ username, email, password, isVerified: true });

            // During signup, I created a second Redis key (`unverified-email:<email>`) to help with the "resend email" logic.
            // Now that the user is verified, I can clean up that secondary key.
            await fastify.redis.del(`unverified-email:${email}`);

            reply.send({ message: "Email verified and user registered. Login to access your account" });
        } catch (error) {
            // This is an edge case. What if another user signed up and verified with the same email
            // in the few minutes between this user's signup and their verification?
            // MongoDB's unique index on email/username will throw an error with code 11000. I need to handle that gracefully.
            if (error.code === 11000) {
                return reply.code(409).send({ error: "This email or username is already registered." });
            }
            fastify.log.error(error, "Error during user creation from verification link");
            return reply.code(500).send({ error: "An error occurred during registration." });
        }
    });
}
