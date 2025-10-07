
import express from 'express';
import { createSale, getSales } from '../controllers/saleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

const saleValidation = [
    body('itemId').notEmpty().withMessage('Item ID is required'),
    body('quantitySold').isInt({ gt: 0 }).withMessage('Quantity must be a positive number'),
    body('actualSellingPrice').isFloat({ gt: 0 }).withMessage('Selling price must be a positive number'),
    body('paymentMethod').isIn(['Cash', 'Mpesa']).withMessage('Invalid payment method'),
    body('attendant').notEmpty().withMessage('Attendant name is required'),
];

router.route('/').get(protect, getSales).post(protect, saleValidation, createSale);

export default router;
