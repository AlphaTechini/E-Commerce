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

            // --- Cart Merging Logic --- //
            // This is where I handle the case where a guest with items in their cart logs in.
            const guestCartId = req.headers['x-cart-id'];
            if (guestCartId) {
                // I need to find both the guest's cart (using the ID from the header)
                // and check if the user already has a cart saved to their account.
                const guestCart = await Cart.findById(guestCartId);
                const userCart = await Cart.findOne({ userId: user._id });

                if (guestCart) {
                    if (userCart) {
                        // Scenario 1: The user already has a cart. I need to merge the guest's items into it.
                        for (const guestItem of guestCart.items) {
                            // Check if the user's cart already has this specific product.
                            const userItem = userCart.items.find(item => 
                                item.productId.equals(guestItem.productId)
                            );

                            if (userItem) {
                                // If it exists, I'll just add the quantities together.
                                userItem.quantity += guestItem.quantity;
                            } else {
                                // If it's a new item, I'll push it into the user's cart array.
                                userCart.items.push(guestItem);
                            }
                        }
                        await userCart.save();
                        // Now that everything is merged, I can delete the old guest cart to keep the database clean.
                        await Cart.findByIdAndDelete(guestCartId);
                    } else {
                        // Scenario 2: The user doesn't have a cart yet. This is the easy case.
                        // I can just "claim" the guest cart for the user by assigning their userId to it.
                        guestCart.userId = user._id;
                        await guestCart.save();
                    }
                }
            }

            const token = fastify.jwt.sign(
                { userId: user._id, username: user.username, role: user.role },
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