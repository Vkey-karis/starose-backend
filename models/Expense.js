
import mongoose from 'mongoose';

const expenseSchema = mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['rent', 'utilities', 'wages', 'supplies', 'other'],
        },
        date: {
            type: Date,
            default: Date.now,
        },
        description: {
            type: String,
            required: true,
        },
        recurring: {
            type: Boolean,
            default: false,
        },
        attendant: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
