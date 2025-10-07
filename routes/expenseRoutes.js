
import express from 'express';
import { createExpense, getExpenses } from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

const expenseValidation = [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('category').isIn(['rent', 'utilities', 'wages', 'supplies', 'other']).withMessage('Invalid category'),
    body('description').notEmpty().withMessage('Description is required'),
    body('date').isISO8601().toDate().withMessage('Valid date is required'),
];

router.route('/').get(protect, getExpenses).post(protect, expenseValidation, createExpense);

export default router;
