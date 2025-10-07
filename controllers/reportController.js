
import asyncHandler from 'express-async-handler';
import Sale from '../models/Sale.js';
import Expense from '../models/Expense.js';
import Item from '../models/Item.js';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// @desc    Get summary report data
// @route   GET /api/reports/summary
// @access  Private
const getSummaryReport = asyncHandler(async (req, res) => {
    const { from, to, period } = req.query;

    const fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0));
    const toDate = to ? new Date(to) : new Date(new Date().setHours(23, 59, 59, 999));
    
    const dateFilter = { date: { $gte: fromDate, $lte: toDate } };

    // --- Aggregations ---
    const salesData = await Sale.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: null,
                totalSales: { $sum: '$totalSale' },
                totalCost: { $sum: { $multiply: ['$buyingPriceAtSale', '$quantitySold'] } },
            },
        },
    ]);

    const expenseData = await Expense.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: null,
                totalExpenses: { $sum: '$amount' },
            },
        },
    ]);

    const topSellingItems = await Sale.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: '$itemName',
                totalQuantity: { $sum: '$quantitySold' },
                totalRevenue: { $sum: '$totalSale' },
            },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
    ]);

    // Sales and Profit Trend
    const getGroupId = () => {
        switch(period) {
            case 'monthly':
                return { year: { $year: '$date' }, month: { $month: '$date' } };
            case 'weekly':
                return { year: { $year: '$date' }, week: { $week: '$date' } };
            default: // daily
                return { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } };
        }
    };
    
    const salesTrend = await Sale.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: getGroupId(),
                sales: { $sum: '$totalSale' },
                profit: { $sum: '$profit' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);
    
    // --- Calculations ---
    const totalSales = salesData[0]?.totalSales || 0;
    const totalCost = salesData[0]?.totalCost || 0;
    const grossProfit = totalSales - totalCost;
    const totalExpenses = expenseData[0]?.totalExpenses || 0;
    const netProfit = grossProfit - totalExpenses;
    
    const lowStockItems = await Item.find({
        $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).limit(10);

    res.json({
        summary: {
            totalSales,
            grossProfit,
            totalExpenses,
            netProfit,
            lowStockCount: lowStockItems.length,
        },
        topSellingItems,
        lowStockItems,
        salesTrend,
    });
});

// @desc    Export report as Excel or PDF
// @route   GET /api/reports/export
// @access  Private
const exportReport = asyncHandler(async (req, res) => {
    const { from, to, format } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const dateFilter = { date: { $gte: fromDate, $lte: toDate } };

    const sales = await Sale.find(dateFilter).sort({ date: 'asc' });
    const expenses = await Expense.find(dateFilter).sort({ date: 'asc' });

    const totalSales = sales.reduce((acc, sale) => acc + sale.totalSale, 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const grossProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);
    const netProfit = grossProfit - totalExpenses;

    const dateRangeStr = `${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`;

    if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Starose Cyber Café System';
        workbook.created = new Date();

        // --- Summary Sheet ---
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.addRow(['Starose Cyber Café - Financial Report']);
        summarySheet.addRow([`Date Range: ${dateRangeStr}`]);
        summarySheet.addRow([]);
        summarySheet.addRow(['Metric', 'Amount (KES)']);
        summarySheet.addRow(['Total Sales', totalSales]);
        summarySheet.addRow(['Gross Profit', grossProfit]);
        summarySheet.addRow(['Total Expenses', totalExpenses]);
        summarySheet.addRow(['Net Profit', netProfit]);

        // --- Sales Sheet ---
        const salesSheet = workbook.addWorksheet('Sales');
        salesSheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Item Name', key: 'itemName', width: 30 },
            { header: 'Qty', key: 'quantitySold', width: 10 },
            { header: 'Price', key: 'actualSellingPrice', width: 15 },
            { header: 'Total', key: 'totalSale', width: 15 },
            { header: 'Profit', key: 'profit', width: 15 },
        ];
        sales.forEach(s => salesSheet.addRow(s));

        // --- Expenses Sheet ---
        const expensesSheet = workbook.addWorksheet('Expenses');
        expensesSheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Description', key: 'description', width: 40 },
            { header: 'Amount', key: 'amount', width: 15 },
        ];
        expenses.forEach(e => expensesSheet.addRow(e));
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Starose_Report.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } else if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text('Starose Cyber Café - Financial Report', 14, 16);
        doc.setFontSize(10);
        doc.text(`Date Range: ${dateRangeStr}`, 14, 22);

        // Summary Table
        doc.autoTable({
            startY: 30,
            head: [['Metric', 'Amount (KES)']],
            body: [
                ['Total Sales', totalSales.toFixed(2)],
                ['Gross Profit', grossProfit.toFixed(2)],
                ['Total Expenses', totalExpenses.toFixed(2)],
                ['Net Profit', netProfit.toFixed(2)],
            ],
        });
        
        // Sales Table
        doc.addPage();
        doc.text('Sales Details', 14, 16);
        doc.autoTable({
            startY: 22,
            head: [['Date', 'Item', 'Qty', 'Price', 'Total', 'Profit']],
            body: sales.map(s => [
                new Date(s.date).toLocaleDateString(),
                s.itemName,
                s.quantitySold,
                s.actualSellingPrice.toFixed(2),
                s.totalSale.toFixed(2),
                s.profit.toFixed(2)
            ]),
        });

        // Expenses Table
        doc.addPage();
        doc.text('Expenses Details', 14, 16);
        doc.autoTable({
            startY: 22,
            head: [['Date', 'Category', 'Description', 'Amount']],
            body: expenses.map(e => [
                new Date(e.date).toLocaleDateString(),
                e.category,
                e.description,
                e.amount.toFixed(2)
            ]),
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Starose_Report.pdf"');
        res.send(Buffer.from(doc.output('arraybuffer')));
        
    } else {
        res.status(400);
        throw new Error('Invalid export format specified');
    }
});

export { getSummaryReport, exportReport };
