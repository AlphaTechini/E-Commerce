import argon2 from "argon2";
import User from "../../models/User.js";
import Cart from "../../models/Cart.js";

export default async function (fastify, opts) {
    const loginSchema = {
        body: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
                username: { type: 'string' },
                password: { type: 'string' }
            }
        },
        headers: {
            type: 'object',
            properties: {
                'x-cart-id': { type: 'string' } // Optional cart ID for guests
            }
        }
    };

    fastify.post('/login', { schema: loginSchema }, async(req, reply) => {
        try {
            const {username, password} = req.body;
            const user = await User.findOne({username}); //Check if username exists in the database
            
            if (!user) {
                return reply.code(401).send({error: "Incorrect Credentials"});
            }

            if (!user.isVerified) {
                // You might want to trigger the resend-email logic here or provide a specific frontend route.
                return reply.code(403).send({ error: "Account not verified. Please check your email for the verification link." });
            }
            
            const isMatch = await argon2.verify(user.password, password);
            
            if (!isMatch) {
                return reply.code(401).send({error: 
                     "Incorrect Credentials"});
            }

            // --- Cart Merging Logic ---
            const guestCartId = req.headers['x-cart-id'];
            if (guestCartId) {
                const guestCart = await Cart.findById(guestCartId);
                const userCart = await Cart.findOne({ userId: user._id });

                if (guestCart) {
                    if (userCart) {
                        // Scenario 1: User has an existing cart, merge guest cart into it.
                        for (const guestItem of guestCart.items) {
                            const userItem = userCart.items.find(item => 
                                item.productId.equals(guestItem.productId)
                            );

                            if (userItem) {
                                // Item exists, update quantity
                                userItem.quantity += guestItem.quantity;
                            } else {
                                // New item, add to user's cart
                                userCart.items.push(guestItem);
                            }
                        }
                        await userCart.save();
                        await Cart.findByIdAndDelete(guestCartId); // Clean up the guest cart
                    } else {
                        // Scenario 2: User has no cart, assign the guest cart to them.
                        guestCart.userId = user._id;
                        await guestCart.save();
                    }
                }
            }

            const token = fastify.jwt.sign(
                { userId: user._id, username: user.username },
                {expiresIn: "1h"}
            );
            return reply.code(200).send({
                message: `Welcome user ${user.username}`,
                token: token
            });      
        } catch (error) {
            fastify.log.error(error, "Login error");
            return reply.code(500).send({error: "An error occurred during login: " + error.message});
        }
    });
}