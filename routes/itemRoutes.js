
import express from 'express';
import {
    createItem,
    getItems,
    getItemById,
    updateItem,
    deleteItem,
} from '../controllers/itemController.js';
import { protect } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

const itemValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('buyingPrice').isNumeric().withMessage('Buying price must be a number'),
    body('defaultSellingPrice').isNumeric().withMessage('Selling price must be a number'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('lowStockThreshold').isNumeric().withMessage('Low stock threshold must be a number'),
];

router.route('/').get(protect, getItems).post(protect, itemValidation, createItem);
router
    .route('/:id')
    .get(protect, getItemById)
    .put(protect, itemValidation, updateItem)
    .delete(protect, deleteItem);

export default router;
