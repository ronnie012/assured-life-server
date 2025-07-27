const express = require('express');
const multer = require('multer');
const { submitClaim, getAllClaims, getUserClaims, updateClaimStatus } = require('../controllers/claimController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', firebaseAuthMiddleware, checkRole(['customer']), upload.array('documents'), submitClaim);
router.get('/', firebaseAuthMiddleware, checkRole(['admin', 'agent']), getAllClaims);
router.get('/my-claims', firebaseAuthMiddleware, checkRole(['customer']), getUserClaims);
router.put('/:id/status', firebaseAuthMiddleware, checkRole(['admin', 'agent']), updateClaimStatus);

module.exports = router;
