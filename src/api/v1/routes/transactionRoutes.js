const express = require('express');
const { getAllTransactions, createTransaction, updateTransaction, deleteTransaction } = require('../controllers/transactionController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.get('/', firebaseAuthMiddleware, checkRole(['admin']), getAllTransactions);
router.post('/', firebaseAuthMiddleware, checkRole(['admin']), createTransaction);
router.put('/:id', firebaseAuthMiddleware, checkRole(['admin']), updateTransaction);
router.delete('/:id', firebaseAuthMiddleware, checkRole(['admin']), deleteTransaction);

module.exports = router;