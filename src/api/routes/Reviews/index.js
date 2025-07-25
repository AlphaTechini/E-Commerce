import Review from '../../models/Review.js';
import Order from '../../models/Order.js';

export default async function (fastify, opts) {
    // All routes here require authentication
    fastify.addHook('onRequest', fastify.authenticate);

    const createReviewSchema = {
        body: {
            type: 'object',
            required: ['productId', 'rating'],
            properties: {
                productId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                rating: { type: 'number', minimum: 1, maximum: 5 },
                comment: { type: 'string' }
            }
        }
    };

    // POST /api/reviews - Create a new review
    fastify.post('/reviews', { schema: createReviewSchema }, async (request, reply) => {
        const { productId, rating, comment } = request.body;
        const { userId, username } = request.user;

        try {
            // 1. Verify the user has purchased the product
            const hasPurchased = await Order.findOne({
                userId,
                'items.productId': productId,
                // Optional: only allow reviews for delivered orders
                // status: 'delivered' 
            });

            if (!hasPurchased) {
                return reply.code(403).send({ error: "You can only review products you have purchased." });
            }

            // 2. Create the review (the unique index on the model will prevent duplicates)
            const review = await Review.create({
                productId,
                userId,
                username, // from JWT
                rating,
                comment
            });

            return reply.code(201).send(review);

        } catch (error) {
            // Handle duplicate review error
            if (error.code === 11000) {
                return reply.code(409).send({ error: "You have already submitted a review for this product." });
            }
            fastify.log.error(error, 'Error creating review');
            return reply.code(500).send({ error: 'An internal error occurred while creating the review.' });
        }
    });
}

