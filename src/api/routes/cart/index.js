import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';

export default async function (fastify, opts) {

    // This onRequest hook is for "optional authentication". It will try to verify a JWT if one is sent.
    // If it's a valid token, `request.user` will be populated.
    // If there's no token or it's invalid, I'll just ignore the error and treat them as a guest.
    // This is perfect for features like the cart that should work for everyone.
    fastify.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) { /* Guest user, ignore error */ }
    });

    // This preHandler hook runs after the optional authentication. Its job is to find and
    // attach the user's cart to the request object, so I don't have to repeat this logic in every route.
    fastify.addHook('preHandler', async (request) => {
        if (request.user) {
            // If the user is logged in (meaning jwtVerify succeeded), I'll find their cart using their userId.
            request.cart = await Cart.findOne({ userId: request.user.userId });
        } else if (request.headers['x-cart-id']) {
            // If they're a guest, I'll check if they sent a cart ID in the 'x-cart-id' header.
            // This is how I keep track of a guest's cart across multiple requests.
            try {
                request.cart = await Cart.findById(request.headers['x-cart-id']);
            } catch (error) {
                // This handles cases where the guest sends a bogus or malformed cart ID.
                // I'll just set the cart to null and let the route handler deal with it.
                request.cart = null;
            }
        }
    });

    fastify.get('/cart', async (request) => {
        // If a cart was found in the preHandler, return it.
        // The preHandler already did all the hard work of finding the cart.
        if (request.cart) {
            return request.cart;
        }

        // If no cart exists for the user yet, just return an empty cart structure.
        // This ensures the frontend always gets a consistent response shape.
        return { items: [], totalPrice: 0 };
    });

    const addItemSchema = {
        body: {
            type: 'object',
            required: ['productId', 'quantity'],
            properties: {
                productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                quantity: { type: 'number', minimum: 1 }
            }
        }
    };

    fastify.post('/cart/items', { schema: addItemSchema }, async (request, reply) => {
        const { productId, quantity } = request.body;
        let cart = request.cart;

        // It's good practice to validate that the product exists before adding it to the cart.
        const product = await Product.findById(productId);
        if (!product) {
            return reply.code(404).send({ error: 'Product not found' });
        }

        // If the preHandler couldn't find a cart, I need to create one now.
        if (!cart) {
            if (request.user) {
                // If it's a logged-in user, I'll create a cart and link it to their userId.
                cart = await Cart.create({ userId: request.user.userId, items: [] });
            } else {
                // If it's a guest, I'll create a new cart without a userId.
                cart = await Cart.create({ items: [] });
            }
        }

        // Now that I'm sure I have a cart, I'll check if the product is already in it.
        const existingItem = cart.items.find(item => item.productId.toString() === productId);

        if (existingItem) {
            // If it's already there, just increase the quantity.
            existingItem.quantity += quantity;
        } else {
            // If it's a new item, add it to the items array.
            cart.items.push({ productId, quantity });
        }

        await cart.save();

        // This is super important for guests. I need to send the new cart's ID back in a header.
        // The frontend will then store this ID and send it back on the next cart request.
        if (!request.user) {
            reply.header('x-cart-id', cart._id.toString());
        }

        return cart;
    });

    const itemParamsSchema = {
        params: {
            type: 'object',
            required: ['productId'],
            properties: {
                productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            }
        }
    };

    const updateItemSchema = {
        ...itemParamsSchema,
        body: {
            type: 'object',
            required: ['quantity'],
            properties: {
                quantity: { type: 'number', minimum: 1 }
            }
        }
    };

    // PUT /api/cart/items/:productId - Update an item's quantity
    fastify.put('/cart/items/:productId', { schema: updateItemSchema }, async (request, reply) => {
        const { productId } = request.params;
        const { quantity } = request.body;
        const { cart } = request;

        if (!cart) {
            return reply.code(404).send({ error: 'Cart not found.' });
        }

        // Find the specific item in the cart's items array.
        const itemToUpdate = cart.items.find(item => item.productId.toString() === productId);

        if (!itemToUpdate) {
            return reply.code(404).send({ error: 'Item not found in cart.' });
        }

        // Update the quantity to the new value and save the whole cart document.
        itemToUpdate.quantity = quantity;
        await cart.save();

        return cart;
    });

    // DELETE /api/cart/items/:productId - Remove an item from the cart
    fastify.delete('/cart/items/:productId', { schema: itemParamsSchema }, async (request, reply) => {
        const { productId } = request.params;
        const { cart } = request;

        if (!cart) {
            return reply.code(404).send({ error: 'Cart not found.' });
        }

        // To improve performance and ensure atomicity, we use MongoDB's $pull operator.
        // This tells the database to directly remove the item from the array that matches
        // our condition, without us having to fetch and resave the whole document.
        const result = await Cart.updateOne(
            { _id: cart._id },
            { $pull: { items: { productId: productId } } }
        );

        // The `modifiedCount` property from the update result tells us if a document was changed.
        // If it's 0, it means no item with that productId was found in the cart.
        if (result.modifiedCount === 0) {
            return reply.code(404).send({ error: 'Item not found in cart.' });
        }

        // Fetch the updated cart to return the latest state to the client.
        const updatedCart = await Cart.findById(cart._id);
        return updatedCart;
    });
}