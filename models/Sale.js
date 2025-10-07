
import mongoose from 'mongoose';

const saleSchema = mongoose.Schema(
    {
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Item',
        },
        itemName: { // Denormalized for easier reporting
            type: String,
            required: true,
        },
        quantitySold: {
            type: Number,
            required: true,
        },
        actualSellingPrice: { // Price per item
            type: Number,
            required: true,
        },
        totalSale: {
            type: Number,
            required: true,
        },
        buyingPriceAtSale: { // Cost of goods sold (COGS) per item
            type: Number,
            required: true,
        },
        profit: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ['Cash', 'Mpesa'],
        },
        attendant: {
            type: String,
            required: true,
        },
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
