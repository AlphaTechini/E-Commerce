import Product from '../../models/Product.js';
import Review from '../../models/Review.js';

export default async function (fastify, opts) {

    const getProductsSchema = {
        querystring: {
            type: 'object',
            properties: {
                page: { type: 'integer', minimum: 1, default: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                category: { type: 'string' },
                sortBy: { type: 'string', default: 'createdAt' },
                sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
            }
        }
    };

    // Get all products with filtering, sorting, and pagination
    fastify.get('/products', { schema: getProductsSchema }, async (request, reply) => {
        try {
            const { page, limit, category, sortBy, sortOrder } = request.query;

            const query = {};
            if (category) query.category = category;

            const sort = {};
            if (sortBy) sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            const skip = (page - 1) * limit;

            const products = await Product.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const totalProducts = await Product.countDocuments(query);
            const totalPages = Math.ceil(totalProducts / limit);

            return {
                products,
                pagination: { currentPage: page, totalPages, totalProducts, limit }
            };
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

    // Route for text search on products
    const searchProductsSchema = {
        querystring: {
            type: 'object',
            required: ['q'],
            properties: {
                q: { type: 'string' },
                page: { type: 'integer', minimum: 1, default: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
            }
        }
    };

    fastify.get('/products/search', { schema: searchProductsSchema }, async (request, reply) => {
        try {
            const { q, page, limit } = request.query;

            const query = { $text: { $search: q } };
            const skip = (page - 1) * limit;

            // We also project a 'score' field to see the relevance of the search results
            const products = await Product.find(query, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
                .skip(skip)
                .limit(limit);

            const totalProducts = await Product.countDocuments(query);
            const totalPages = Math.ceil(totalProducts / limit);

            return {
                products,
                pagination: { currentPage: page, totalPages, totalProducts, limit }
            };
        } catch (error) {
            fastify.log.error(error, 'Error searching products');
            return reply.code(500).send({ error: 'An internal error occurred during search' });
        }
    });

    // Route to get reviews for a specific product
    const getReviewsSchema = {
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            }
        },
        querystring: {
            type: 'object',
            properties: {
                page: { type: 'integer', minimum: 1, default: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
            }
        }
    };

    fastify.get('/products/:id/reviews', { schema: getReviewsSchema }, async (request, reply) => {
        try {
            const { page, limit } = request.query;
            const skip = (page - 1) * limit;

            const reviews = await Review.find({ productId: request.params.id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            
            const totalReviews = await Review.countDocuments({ productId: request.params.id });
            const totalPages = Math.ceil(totalReviews / limit);

            return {
                reviews,
                pagination: { currentPage: page, totalPages, totalReviews, limit }
            };
        } catch (error) {
            fastify.log.error(error, 'Error fetching reviews for product');
            return reply.code(500).send({ error: 'An internal error occurred' });
        }
    });
}