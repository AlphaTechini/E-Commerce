import argon2 from "argon2";
import User from "../../models/User.js";

export default async function (fastify, opts) {
    const loginSchema = {
        body: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
                username: { type: 'string' },
                password: { type: 'string' }
            }
        }
    };

    // This route will be available at POST /api/admin/login
    fastify.post('/login', { schema: loginSchema }, async (req, reply) => {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username });

            if (!user) {
                return reply.code(401).send({ error: "Incorrect Credentials" });
            }

            // Crucial check: ensure the user is an admin
            if (user.role !== 'admin') {
                return reply.code(403).send({ error: "Forbidden: You do not have admin privileges." });
            }

            if (!user.isVerified) {
                return reply.code(403).send({ error: "Admin account not verified." });
            }

            const isMatch = await argon2.verify(user.password, password);

            if (!isMatch) {
                return reply.code(401).send({ error: "Incorrect Credentials" });
            }

            const token = fastify.jwt.sign(
                { userId: user._id, username: user.username, role: user.role },
                { expiresIn: "1h" } // Admin sessions can be shorter for security
            );

            return { message: `Welcome admin ${user.username}`, token };
        } catch (error) {
            fastify.log.error(error, "Admin login error");
            return reply.code(500).send({ error: "An error occurred during login." });
        }
    });
}