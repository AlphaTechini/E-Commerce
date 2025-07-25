import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const cartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product', // Assuming you have a Product model
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
    // You might also store the price here at the time of adding
    // to protect against price changes while the item is in the cart.
}, { _id: false }); // Don't create a separate _id for subdocuments

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Link to the User model
        index: true,
        unique: true, // A user can only have one active cart
        sparse: true // This allows multiple documents to have a null userId (for guest carts)
    },
    items: [cartItemSchema],
    // You could add more fields like coupon codes, total, etc.
    // These are often calculated on the fly rather than stored.
}, { timestamps: true }); // Adds createdAt and updatedAt

export default model('Cart', cartSchema);