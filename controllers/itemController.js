
import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';
import Item from '../models/Item.js';

// @desc    Create a new item
// @route   POST /api/items
// @access  Private
const createItem = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, category, buyingPrice, defaultSellingPrice, quantity, lowStockThreshold, sku } = req.body;

    if (sku) {
        const skuExists = await Item.findOne({ sku });
        if (skuExists) {
            res.status(400);
            throw new Error('Item with this SKU already exists');
        }
    }

    const item = new Item({
        name,
        category,
        buyingPrice,
        defaultSellingPrice,
        quantity,
        lowStockThreshold,
        sku,
        lastRestockDate: new Date(),
    });

    const createdItem = await item.save();
    res.status(201).json(createdItem);
});

// @desc    Get all items with filtering and pagination
// @route   GET /api/items
// @access  Private
const getItems = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;
    
    const keyword = req.query.keyword
        ? {
              name: {
                  $regex: req.query.keyword,
                  $options: 'i',
              },
          }
        : {};

    const category = req.query.category ? { category: req.query.category } : {};

    const count = await Item.countDocuments({ ...keyword, ...category });
    const items = await Item.find({ ...keyword, ...category })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    const categories = await Item.find().distinct('category');

    res.json({ items, page, pages: Math.ceil(count / pageSize), categories, count });
});

// @desc    Get a single item by ID
// @route   GET /api/items/:id
// @access  Private
const getItemById = asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (item) {
        res.json(item);
    } else {
        res.status(404);
        throw new Error('Item not found');
    }
});

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Private
const updateItem = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, category, buyingPrice, defaultSellingPrice, quantity, lowStockThreshold, sku } = req.body;
    
    const item = await Item.findById(req.params.id);

    if (item) {
        const originalQuantity = item.quantity;

        item.name = name;
        item.category = category;
        item.buyingPrice = buyingPrice;
        item.defaultSellingPrice = defaultSellingPrice;
        item.quantity = quantity;
        item.lowStockThreshold = lowStockThreshold;
        item.sku = sku;

        // If quantity is increased, it's a restock
        if (quantity > originalQuantity) {
            item.lastRestockDate = new Date();
        }

        const updatedItem = await item.save();
        res.json(updatedItem);
    } else {
        res.status(404);
        throw new Error('Item not found');
    }
});

// @desc    Delete an item
// @route   DELETE /api/items/:id
// @access  Private
const deleteItem = asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);

    if (item) {
        await Item.deleteOne({ _id: req.params.id });
        res.json({ message: 'Item removed' });
    } else {
        res.status(404);
        throw new Error('Item not found');
    }
});

export { createItem, getItems, getItemById, updateItem, deleteItem };
