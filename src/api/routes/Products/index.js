import Product from '../../models/Product.js';

export default async function (fastify, opts) {

    // Get all products
    fastify.get('/products', async (request, reply) => {
        try {
            // We can add pagination, filtering, and sorting here later
            const products = await Product.find({});
            return products;
        } catch (error) {
            fastify.log.error(error, 'Error fetching products');
            return reply.code(500).send({ error: 'An internal error occurred' });
        }
    });

    // Get a single product by ID
    fastify.get('/products/:id', async (request, reply) => {
        try {
            const product = await Product.findById(request.params.id);
            if (!product) {
                return reply.code(404).send({ error: 'Product not found' });
            }
            return product;
        } catch (error) {
            fastify.log.error(error, 'Error fetching single product');
            return reply.code(500).send({ error: 'An internal error occurred' });
        }
    });

    // We can add admin-only routes for creating/updating/deleting products later.
}