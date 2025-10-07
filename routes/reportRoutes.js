
import express from 'express';
import { getSummaryReport, exportReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/summary').get(protect, getSummaryReport);
router.route('/export').get(protect, exportReport);

export default router;
