const express = require('express');
const { getAppliedPoliciesForUser } = require('../controllers/customerController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.get('/my-policies', firebaseAuthMiddleware, checkRole(['customer']), getAppliedPoliciesForUser);

module.exports = router;
