
import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';
import Expense from '../models/Expense.js';

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { amount, category, date, description, recurring, attendant } = req.body;

    const expense = new Expense({
        amount,
        category,
        date,
        description,
        recurring,
        attendant,
    });

    const createdExpense = await expense.save();
    res.status(201).json(createdExpense);
});

// @desc    Get all expenses with filtering
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;

    const filter = {};
    if (req.query.from && req.query.to) {
        filter.date = { $gte: new Date(req.query.from), $lte: new Date(req.query.to) };
    }
    if (req.query.category) {
        filter.category = req.query.category;
    }

    const count = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ date: -1 });

    res.json({ expenses, page, pages: Math.ceil(count / pageSize), count });
});

export { createExpense, getExpenses };
