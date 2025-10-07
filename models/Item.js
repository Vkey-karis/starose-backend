
import mongoose from 'mongoose';

const itemSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        buyingPrice: {
            type: Number,
            required: true,
        },
        defaultSellingPrice: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
        },
        lastRestockDate: {
            type: Date,
            default: Date.now,
        },
        lowStockThreshold: {
            type: Number,
            required: true,
            default: 5,
        },
        sku: {
            type: String,
            trim: true,
            unique: true,
            sparse: true, // Allows multiple null values for sku
        },
    },
    {
        timestamps: true,
    }
);

const Item = mongoose.model('Item', itemSchema);

export default Item;
