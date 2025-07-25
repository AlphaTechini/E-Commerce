import Order from '../../models/Order.js';

export default async function (fastify, opts) {
    // Protect all routes in this plugin with the admin verification hook
    fastify.addHook('onRequest', fastify.verifyAdmin);

    // --- Order Management ---

    const getOrdersSchema = {
        querystring: {
            type: 'object',
            properties: {
                page: { type: 'integer', minimum: 1, default: 1 },
                limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] }
            }
        }
    };

    // Route for admins to view all orders (GET /api/admin/orders)
    fastify.get('/orders', { schema: getOrdersSchema }, async (request, reply) => {
        try {
            const { page, limit, status } = request.query;

            const query = {};
            if (status) query.status = status;

            const skip = (page - 1) * limit;

            // We populate 'userId' to get basic user info along with the order
            // and sort by creation date to show the newest orders first.
            const orders = await Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username email');

            const totalOrders = await Order.countDocuments(query);
            const totalPages = Math.ceil(totalOrders / limit);

            return { orders, pagination: { currentPage: page, totalPages, totalOrders, limit } };
        } catch (error) {
            fastify.log.error(error, 'Error fetching all orders');
            return reply.code(500).send({ error: 'An internal error occurred while fetching orders.' });
        }
    });

    const updateOrderStatusSchema = {
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } // MongoDB ObjectId
            }
        },
        body: {
            type: 'object',
            required: ['status'],
            properties: {
                status: {
                    type: 'string',
                    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
                }
            }
        }
    };

    // Route for admins to update an order's status (PATCH /api/admin/orders/:id)
    fastify.patch('/orders/:id', { schema: updateOrderStatusSchema }, async (request, reply) => {
        try {
            const order = await Order.findByIdAndUpdate(
                request.params.id,
                { status: request.body.status },
                { new: true, runValidators: true } // Return the updated doc and run schema validators
            ).populate('userId', 'username email');

            if (!order) {
                return reply.code(404).send({ error: 'Order not found.' });
            }

            // --- Send email notification to the user ---
            // We do this after successfully updating the database.
            if (order.userId && order.userId.email) {
                const { email, username } = order.userId;
                const newStatus = order.status;

                // We send the email but don't wait for it to complete (fire and forget).
                // This ensures the admin gets a fast response, and any email sending
                // failure won't cause the API request to fail.
                fastify.mailer.sendMail({
                    from: fastify.config.SMTP_FROM,
                    to: email,
                    subject: `Your Order Status has been Updated: ${newStatus}`,
                    html: `<p>Hello ${username},</p><p>The status of your order (ID: ${order._id}) has been updated to <strong>${newStatus}</strong>.</p><p>Thank you for shopping with us!</p>`
                }).catch(err => {
                    fastify.log.error(err, `Failed to send order status email to ${email}`);
                });
            }

            return order;
        } catch (error) {
            fastify.log.error(error, 'Error updating order status');
            return reply.code(500).send({ error: 'An internal error occurred while updating the order status.' });
        }
    });
}
