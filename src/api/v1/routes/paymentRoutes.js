const express = require('express');
const { createPaymentIntent, savePaymentInfo } = require('../controllers/paymentController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');

const router = express.Router();

router.post('/create-payment-intent', firebaseAuthMiddleware, createPaymentIntent);
router.post('/save-payment-info', firebaseAuthMiddleware, savePaymentInfo);

module.exports = router;
