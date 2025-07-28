import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const specsSchema = new Schema({
    RAM: { type: String, trim: true },
    Storage: { type: String, trim: true },
    Battery: { type: String, trim: true },
    ScreenSize: { type: String, trim: true },
    Processor: { type: String, trim: true }
}, { _id: false });

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        index: true // Index for faster category-based queries
    },
    brand: {
        type: String,
        trim: true,
        index: true,
        default: 'YOUR_BRAND_NAME' // Set your brand name here
    },
    specs: {
        type: specsSchema,
        default: {}
    },
    description: {
        type: String,
        trim: true
    },
    price: { type: Number, required: true, min: 0 },
    tags: [String],
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
        set: (val) => Math.round(val * 10) / 10 // Rounds to one decimal place
    },
    numReviews: {
        type: Number,
        min: 0,
        default: 0
    }
}, { timestamps: true });

productSchema.index({
    name: 'text',
    description: 'text',
    brand: 'text',
    category: 'text',
    tags: 'text'
}, {
    weights: {
        name: 10,
        brand: 5 //useful only if you have many brands
    },
    name: 'ProductTextSearchIndex'
});

export default model('Product', productSchema);