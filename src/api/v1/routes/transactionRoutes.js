const express = require('express');
const { getAllTransactions, getUserTransactions } = require('../controllers/transactionController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.get('/', firebaseAuthMiddleware, checkRole(['admin']), getAllTransactions);
router.get('/my-transactions', firebaseAuthMiddleware, checkRole(['customer']), getUserTransactions);

module.exports = router;