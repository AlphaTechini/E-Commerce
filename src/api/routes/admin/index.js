import Product from '../../models/Product.js';

export default async function (fastify, opts) {

    // This hook is the security guard for this whole file.
    // It runs my custom `verifyAdmin` function on every single request to any route defined below.
    fastify.addHook('onRequest', fastify.verifyAdmin);

    const createProductSchema = {
        body: {
            type: 'object',
            required: ['name', 'category', 'price'],
            properties: {
                name: { type: 'string' },
                category: { type: 'string' },
                price: { type: 'number' },
                description: { type: 'string' },
                stock: { type: 'number', minimum: 0 },
                tags: { type: 'array', items: { type: 'string' } },
                specs: {
                    type: 'object',
                    properties: {
                        RAM: { type: 'string' },
                        Storage: { type: 'string' },
                        Battery: { type: 'string' },
                        ScreenSize: { type: 'string' },
                        Processor: { type: 'string' }
                    }
                }
            }
        }
    };

    // Route for admins to create a new product (POST /api/admin/products)
    fastify.post('/products', { schema: createProductSchema }, async (request, reply) => {
        try {
            const product = new Product(request.body);
            await product.save();
            return reply.code(201).send(product);
        } catch (error) {
            fastify.log.error(error, 'Error creating product');
            // This is a specific check for MongoDB's duplicate key error.
            // It's good practice to handle this gracefully instead of just sending a generic 500 error.
            if (error.code === 11000) {
                return reply.code(409).send({ error: 'A product with similar unique fields already exists.' });
            }
            return reply.code(500).send({ error: 'An internal error occurred while creating the product.' });
        }
    });

    const productParamsSchema = {
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } // MongoDB ObjectId pattern
            }
        }
    };

    // Route for admins to update a product (PUT /api/admin/products/:id)
    // I'm reusing the `createProductSchema` here, but making all the body fields optional.
    // The `...` spread syntax is perfect for this. I combine the params schema with the
    // modified body schema.
    fastify.put('/products/:id', { schema: { ...createProductSchema, ...productParamsSchema, body: { ...createProductSchema.body, required: [] } } }, async (request, reply) => {
        try {
            const product = await Product.findByIdAndUpdate(request.params.id, request.body, {
                new: true, // This option tells Mongoose to return the *new*, updated document.
                runValidators: true // This makes sure that any updates still follow the rules in my model's schema.
            });

            if (!product) {
                return reply.code(404).send({ error: 'Product not found.' });
            }

            return product;
        } catch (error) {
            fastify.log.error(error, 'Error updating product');
            return reply.code(500).send({ error: 'An internal error occurred while updating the product.' });
        }
    });

    // Route for admins to delete a product (DELETE /api/admin/products/:id)
    fastify.delete('/products/:id', { schema: productParamsSchema }, async (request, reply) => {
        try {
            const product = await Product.findByIdAndDelete(request.params.id);

            if (!product) {
                return reply.code(404).send({ error: 'Product not found.' });
            }

            return { message: 'Product deleted successfully.' };
        } catch (error) {
            fastify.log.error(error, 'Error deleting product');
            return reply.code(500).send({ error: 'An internal error occurred while deleting the product.' });
        }
    });
}