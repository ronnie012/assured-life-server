const express = require('express');
const { submitClaim } = require('../controllers/claimController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.post('/', firebaseAuthMiddleware, checkRole(['customer']), submitClaim);

module.exports = router;
