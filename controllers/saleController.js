import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';
import Sale from '../models/Sale.js';
import Item from '../models/Item.js';
import mongoose from 'mongoose';

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Private
const createSale = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { itemId, quantitySold, actualSellingPrice, paymentMethod, attendant, notes } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const item = await Item.findById(itemId).session(session);

        if (!item) {
            await session.abortTransaction();
            session.endSession();
            res.status(404);
            throw new Error('Item not found');
        }

        if (item.quantity < quantitySold) {
            await session.abortTransaction();
            session.endSession();
            res.status(400);
            throw new Error('Insufficient stock for this sale');
        }

        // Decrement item quantity
        item.quantity -= quantitySold;
        await item.save({ session });

        // Calculate sale metrics
        const totalSale = quantitySold * actualSellingPrice;
        const buyingPriceAtSale = item.buyingPrice;
        const profit = (actualSellingPrice - buyingPriceAtSale) * quantitySold;

        // ✅ Explicitly include the date to ensure consistency in reports
        const sale = new Sale({
            itemId,
            itemName: item.name,
            quantitySold,
            actualSellingPrice,
            totalSale,
            buyingPriceAtSale,
            profit,
            paymentMethod,
            attendant,
            notes,
            date: new Date(), // Ensures correct date is stored
        });

        const createdSale = await sale.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(createdSale);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(error.statusCode || 500);
        throw new Error(error.message || 'Could not complete sale transaction');
    }
});

// @desc    Get all sales with filtering
// @route   GET /api/sales
// @access  Private
const getSales = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;

    const filter = {};
    if (req.query.from && req.query.to) {
        filter.date = {
            $gte: new Date(`${req.query.from}T00:00:00.000Z`),
            $lte: new Date(`${req.query.to}T23:59:59.999Z`),
        };
    }
    if (req.query.paymentMethod) {
        filter.paymentMethod = req.query.paymentMethod;
    }
    if (req.query.attendant) {
        filter.attendant = { $regex: req.query.attendant, $options: 'i' };
    }
    if (req.query.itemName) {
        filter.itemName = { $regex: req.query.itemName, $options: 'i' };
    }

    const count = await Sale.countDocuments(filter);
    const sales = await Sale.find(filter)
        .populate('itemId', 'name sku')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ date: -1 });

    res.json({ sales, page, pages: Math.ceil(count / pageSize), count });
});

export { createSale, getSales };
