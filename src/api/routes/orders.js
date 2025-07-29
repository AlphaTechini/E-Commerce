import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export default async function (fastify, opts) {

    // All order routes must be authenticated
    fastify.addHook('onRequest', fastify.verifyJWT);

    // Route to place a new order (POST /api/orders)
    fastify.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['shippingAddress'],
                properties: {
                    shippingAddress: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        const { userId } = request.user;
        const { shippingAddress } = request.body;

        // I need to use a transaction here to make sure all database operations succeed or fail together.
        // This prevents weird states like decrementing stock but not creating an order.
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Find the user's cart. It has to be part of the transaction.
            const cart = await Cart.findOne({ userId }).session(session);
            if (!cart || cart.items.length === 0) {
                await session.abortTransaction(); // Abort early if cart is empty
                return reply.code(400).send({ error: 'Your cart is empty.' });
            }

            // 2. Check stock availability and prepare order items
            // First, get all product IDs from the cart to fetch them in one go.
            const productIds = cart.items.map(item => item.productId);
            // Now, fetch all products from the DB at once. Much more efficient than one by one in a loop.
            const products = await Product.find({ '_id': { $in: productIds } }).session(session);

            // Create a map of productId -> product for quick lookups inside the loop.
            const productMap = products.reduce((map, product) => {
                map[product._id.toString()] = product;
                return map;
            }, {});

            let totalAmount = 0;
            const orderedItems = [];
            const stockUpdates = [];

            // Loop through each item in the cart to validate and prepare for the order.
            for (const item of cart.items) {
                const product = productMap[item.productId.toString()];
                if (!product) {
                    // This can happen if a product was deleted while it was in someone's cart.
                    throw new Error(`Product with ID ${item.productId} could not be found.`);
                }
                if (product.stock < item.quantity) {
                    // The most important check: make sure we're not selling something we don't have.
                    throw new Error(`Not enough stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}.`);
                }

                // Calculate the total price for this line item.
                const itemTotal = product.price * item.quantity;
                totalAmount += itemTotal;

                // Create a "snapshot" of the item for the order. This is important so the order history
                // doesn't change if the product name or price is updated later.
                orderedItems.push({ productId: product._id, name: product.name, price: product.price, quantity: item.quantity });
                
                // Prepare the stock update operation. I'll run all of these at once later.
                stockUpdates.push({ updateOne: { filter: { _id: product._id }, update: { $inc: { stock: -item.quantity } } } });
            }

            // 3. Atomically update all product stocks using a single bulkWrite command.
            await Product.bulkWrite(stockUpdates, { session });

            // 4. Create the new order document with all the details.
            const [newOrder] = await Order.create([{
                userId,
                items: orderedItems,
                totalAmount,
                shippingAddress,
                status: 'pending'
            }], { session });

            // 5. The order is created, so I can now safely clear the user's cart.
            await Cart.findByIdAndDelete(cart._id).session(session);

            // 6. All operations were successful. Time to make them permanent.
            await session.commitTransaction();

            return reply.code(201).send(newOrder);
        } catch (error) {
            // If anything went wrong in the `try` block, undo all database changes.
            await session.abortTransaction();
            fastify.log.error(error, 'Error placing order');
            // Give a specific error message to the user if it's a stock issue.
            if (error.message.includes('stock') || error.message.includes('found')) {
                return reply.code(400).send({ error: error.message });
            }
            return reply.code(500).send({ error: 'An internal error occurred while placing your order.' });
        } finally {
            // No matter what happens, always end the session to release its resources.
            session.endSession();
        }
    });

    // Route to get the current user's order history (GET /api/orders)
    fastify.get('/', async (request, reply) => {
        const { userId } = request.user;

        try {
            // Find all orders for the logged-in user and sort them with the newest first
            const orders = await Order.find({ userId }).sort({ createdAt: -1 });
            return orders;
        } catch (error) {
            fastify.log.error(error, "Error fetching user's orders");
            return reply.code(500).send({ error: 'An internal error occurred while fetching your orders.' });
        }
    });
}
