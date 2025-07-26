const express = require('express');
const { getAllTransactions, createTransaction, updateTransaction, deleteTransaction, getUserTransactions } = require('../controllers/transactionController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.get('/', firebaseAuthMiddleware, checkRole(['admin']), getAllTransactions);
router.post('/', firebaseAuthMiddleware, checkRole(['admin']), createTransaction);
router.put('/:id', firebaseAuthMiddleware, checkRole(['admin']), updateTransaction);
router.delete('/:id', firebaseAuthMiddleware, checkRole(['admin']), deleteTransaction);

router.get('/my-transactions', firebaseAuthMiddleware, checkRole(['customer']), getUserTransactions);

module.exports = router;