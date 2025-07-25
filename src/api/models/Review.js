import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const reviewSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: { // Snapshot of username for display
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// This is a compound index. It ensures that the combination of a productId and a userId is always unique.
// Basically, it stops a single user from leaving multiple reviews on the same product.
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// I'm creating a static method on the Review model itself. This is a great way to keep related logic
// organized. This function will be responsible for calculating the average rating for a specific product.
reviewSchema.statics.calculateAverageRating = async function(productId) {
    // The aggregation pipeline is a powerful MongoDB feature for processing data.
    // It's like a series of steps to transform the data.
    const stats = await this.aggregate([
        // Step 1: Match all reviews that belong to the specific product.
        { $match: { productId: productId } },
        {
            // Step 2: Group the matched reviews together to calculate statistics.
            $group: {
                _id: '$productId',
                numReviews: { $sum: 1 },
                averageRating: { $avg: '$rating' }
            }
        }
    ]);
    
    try {
        // If the aggregation found reviews, `stats` will be an array with one object.
        // If no reviews were found (e.g., the last one was just deleted), `stats` will be empty.
        // So, I'll either use the calculated stats or default to 0 if no reviews are left.
        const update = stats.length > 0 ? stats[0] : { numReviews: 0, averageRating: 0 };
        // Now, I'll update the corresponding Product document with the new numbers.
        await this.model('Product').findByIdAndUpdate(productId, update);
    } catch (error) {
        console.error(error);
    }
};

// These are Mongoose middleware hooks. I want to run my calculation function
// automatically whenever a review is saved (created or updated) or removed.
reviewSchema.post('save', function() { this.constructor.calculateAverageRating(this.productId); });
reviewSchema.post('remove', function() { this.constructor.calculateAverageRating(this.productId); });


export default model('Review', reviewSchema);