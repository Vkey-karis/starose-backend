
import express from 'express';
import { loginUser } from '../controllers/authController.js';
import { body } from 'express-validator';

const router = express.Router();

const loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
];

router.post('/login', loginValidation, loginUser);

export default router;
