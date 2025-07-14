const express = require('express');
const { getCustomerReviews, createReview } = require('../controllers/reviewController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.get('/customer', getCustomerReviews);
router.post('/', firebaseAuthMiddleware, checkRole(['customer']), createReview);

module.exports = router;