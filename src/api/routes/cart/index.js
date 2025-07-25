import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js'; // Assuming a Product model exists

export default async function (fastify, opts) {

    // This hook will attempt to authenticate the user if a JWT is present,
    // but will not fail if it's not. This allows both guests and logged-in
    // users to use the cart endpoints.
    fastify.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) { /* Guest user, ignore error */ }
    });

    // This hook will run for all routes in this plugin
    // It tries to find a cart for the user, whether they are a guest or logged in.
    fastify.addHook('preHandler', async (request, reply) => {
        if (request.user) {
            // User is logged in, find their cart by userId
            request.cart = await Cart.findOne({ userId: request.user.userId });
        } else if (request.headers['x-cart-id']) {
            // Guest user, find their cart by the ID from the header
            try {
                request.cart = await Cart.findById(request.headers['x-cart-id']);
            } catch (error) {
                // Handle cases where the cart ID is invalid or not found
                request.cart = null;
            }
        }
    });

    fastify.get('/cart', async (request, reply) => {
        // If a cart was found in the preHandler, return it.
        if (request.cart) {
            return request.cart;
        }

        // If no cart exists for the user yet, we can either create one
        // or return an empty state. Returning an empty state is often simpler.
        return { items: [] };
    });

    const addItemSchema = {
        body: {
            type: 'object',
            required: ['productId', 'quantity'],
            properties: {
                productId: { type: 'string' }, // Assuming MongoDB ObjectId as string
                quantity: { type: 'number', minimum: 1 }
            }
        }
    };

    fastify.post('/cart/items', { schema: addItemSchema }, async (request, reply) => {
        const { productId, quantity } = request.body;
        let cart = request.cart;

        // Optional: Check if product exists and is in stock
        const product = await Product.findById(productId);
        if (!product) {
            return reply.code(404).send({ error: 'Product not found' });
        }

        // If no cart exists, create one
        if (!cart) {
            if (request.user) {
                // Create a cart for a logged-in user
                cart = await Cart.create({ userId: request.user.userId, items: [] });
            } else {
                // Create a cart for a guest
                cart = await Cart.create({ items: [] });
            }
        }

        // Check if the item is already in the cart
        const existingItem = cart.items.find(item => item.productId.toString() === productId);

        if (existingItem) {
            // If item exists, update its quantity
            existingItem.quantity += quantity;
        } else {
            // If item does not exist, add it to the cart
            cart.items.push({ productId, quantity });
        }

        await cart.save();

        // For guests, we need to send back the cartId so they can make subsequent requests
        if (!request.user) {
            reply.header('x-cart-id', cart._id.toString());
        }

        return cart;
    });

    // We can add more routes here later, such as:
    // PUT /cart/items/:productId - to update quantity
    // DELETE /cart/items/:productId - to remove an item

    // The logic for merging a guest cart on login will be handled
    // in the login route.
}