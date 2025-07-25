import Order from '../../models/Order.js';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';

export default async function (fastify, opts) {

    // All order routes must be authenticated
    fastify.addHook('onRequest', fastify.authenticate);

    // Route to place a new order
    fastify.post('/orders', async (request, reply) => {
        const { userId } = request.user;
        const { shippingAddress } = request.body; // Assuming address is sent in the body

        if (!shippingAddress) {
            return reply.code(400).send({ error: 'Shipping address is required.' });
        }

        try {
            // 1. Find the user's cart and populate product details
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            if (!cart || cart.items.length === 0) {
                return reply.code(400).send({ error: 'Your cart is empty.' });
            }

            // 2. Create order items from cart items (snapshotting price and name)
            let totalAmount = 0;
            const orderedItems = cart.items.map(item => {
                if (!item.productId) {
                    // This can happen if a product was deleted after being added to the cart
                    throw new Error(`A product in your cart could not be found.`);
                }
                const itemTotal = item.productId.price * item.quantity;
                totalAmount += itemTotal;
                return {
                    productId: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    quantity: item.quantity
                };
            });

            // 3. Create the new order
            const newOrder = await Order.create({
                userId,
                items: orderedItems,
                totalAmount,
                shippingAddress,
                status: 'pending'
            });

            // 4. Clear the user's cart
            await Cart.findByIdAndDelete(cart._id);

            return reply.code(201).send(newOrder);

        } catch (error) {
            fastify.log.error(error, 'Error placing order');
            return reply.code(500).send({ error: 'An internal error occurred while placing your order.' });
        }
    });

    // We can add a route to get a user's order history later (e.g., GET /orders)
}
