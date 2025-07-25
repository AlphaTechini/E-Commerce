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
        required: true,
        trim: true,
        index: true // Index for faster brand-based queries
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
    tags: [String]
}, { timestamps: true });

export default model('Product', productSchema);