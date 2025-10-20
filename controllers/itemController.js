// controllers/itemController.js
import Item from '../models/Item.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a new item
// @route   POST /api/items
// @access  Private
export const createItem = asyncHandler(async (req, res) => {
    const { name, category, buyingPrice, defaultSellingPrice, quantity, lowStockThreshold } = req.body;

    const existingItem = await Item.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingItem) {
        res.status(400);
        throw new Error('Item with this name already exists');
    }

    const item = await Item.create({
        name,
        category,
        buyingPrice,
        defaultSellingPrice,
        quantity,
        lowStockThreshold,
    });

    res.status(201).json(item);
});

// @desc    Get all items (supports search + pagination)
// @route   GET /api/items
// @access  Private
export const getItems = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', all = false } = req.query;

        // Build search filter
        const filter = search
            ? {
                  $or: [
                      { name: { $regex: search, $options: 'i' } },
                      { category: { $regex: search, $options: 'i' } },
                  ],
              }
            : {};

        // Return all items (e.g. for dropdowns)
        if (all === 'true') {
            const items = await Item.find(filter).sort({ createdAt: -1 });
            return res.json({ items, total: items.length });
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Item.countDocuments(filter);

        const items = await Item.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            items,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching items:', error.message);
        res.status(500).json({ message: 'Failed to fetch items.' });
    }
});

// @desc    Get single item by ID
// @route   GET /api/items/:id
// @access  Private
export const getItemById = asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (item) {
        res.json(item);
    } else {
        res.status(404);
        throw new Error('Item not found');
    }
});

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
export const updateItem = asyncHandler(async (req, res) => {
    const { name, category, buyingPrice, defaultSellingPrice, quantity, lowStockThreshold } = req.body;

    const item = await Item.findById(req.params.id);
    if (!item) {
        res.status(404);
        throw new Error('Item not found');
    }

    item.name = name || item.name;
    item.category = category || item.category;
    item.buyingPrice = buyingPrice || item.buyingPrice;
    item.defaultSellingPrice = defaultSellingPrice || item.defaultSellingPrice;
    item.quantity = quantity || item.quantity;
    item.lowStockThreshold = lowStockThreshold || item.lowStockThreshold;

    const updatedItem = await item.save();
    res.json(updatedItem);
});

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
export const deleteItem = asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) {
        res.status(404);
        throw new Error('Item not found');
    }

    await item.deleteOne();
    res.json({ message: 'Item removed successfully' });
});
