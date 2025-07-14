const express = require('express');
const { getUserProfile, updateProfile } = require('../controllers/profileController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');

const router = express.Router();

router.get('/', firebaseAuthMiddleware, getUserProfile);
router.put('/', firebaseAuthMiddleware, updateProfile);

module.exports = router;
