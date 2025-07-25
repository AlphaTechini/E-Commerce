import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Enforces uniqueness and creates an index
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true, // Enforces uniqueness and creates an index
        trim: true,
        lowercase: true // Store emails in a consistent format
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

export default mongoose.model('User', userSchema);
