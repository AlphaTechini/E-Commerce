import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const orderedItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: { // Snapshot of the product name
        type: String,
        required: true
    },
    price: { // Snapshot of the price at time of purchase
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [orderedItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: { // Can be expanded into a nested object
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

export default model('Order', orderSchema);