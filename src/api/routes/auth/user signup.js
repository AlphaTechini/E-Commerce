import crypto from "crypto";
import argon2 from "argon2";
import User from "../../models/User.js";

export default async function (fastify, opts) {
    const signupSchema = {
        body: {
            type: 'object',
            required: ['username', 'email', 'password'],
            properties: {
                username: { type: 'string', minLength: 3 },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8, description: 'Password must be at least 8 characters long.' }
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
    fastify.post('/signup', { schema: signupSchema }, async (request, reply ) => {
        try {
            const { username, email, password } = request.body;  //Get client's details

            // Check if user already exists in the main collection
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) {
                return reply.code(409).send({ error: "A user with this email or username already exists." });
            }

            // Hash the password using Argon2 with configurable options
            const hashedPassword = await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: fastify.config.ARGON2_MEMORY_COST,
                timeCost: fastify.config.ARGON2_TIME_COST,
                parallelism: fastify.config.ARGON2_PARALLELISM,
            });

            //Generate unique token
            const token = crypto.randomBytes(32).toString('hex');

            // Store user data and an email->token lookup key temporarily in Redis.
            // A transaction ensures both keys are set or neither are. Expires in 7 minutes.
            const multi = fastify.redis.multi();
            multi.set(
                `verify:${token}`,
                JSON.stringify({ username, email, password: hashedPassword}),
                { EX: 420 }
            );
            multi.set(`unverified-email:${email}`, token, { EX: 420 });
            await multi.exec();

            // Generate verification link using the APP_URL from config
            const verificationLink = `${fastify.config.APP_URL}/api/verify-email?token=${token}`;

            await fastify.mailer.sendMail({
                from: fastify.config.SMTP_FROM,
                to: email,
                subject: "Verify your email",
                html: `
                    <p>Click the button below to verify your email:</p>
                    <p>
                        <a href="${verificationLink}" 
                           style="display:inline-block;padding:12px 24px;background:#003366;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold;">
                            Verify email
                        </a>
                    </p>
                    <p style="margin-top:32px;color:#555;font-size:14px;">
                        If you did not sign up, you can safely ignore this email.
                    </p>
                `
            });
            reply.send({ message: "Verification email sent. Please check your inbox." });
        } catch (error) {
            fastify.log.error(error, "Error during signup process");
            return reply.code(500).send({ error: "An internal error occurred. Please try again later." });
        }
    });
}
