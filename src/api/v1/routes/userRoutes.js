const express = require('express');
const { getAllUsers, updateUserRole, upsertFirebaseUser } = require('../controllers/userController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.get('/', firebaseAuthMiddleware, checkRole(['admin']), getAllUsers);
router.put('/:id/role', firebaseAuthMiddleware, checkRole(['admin']), updateUserRole);
router.post('/upsertFirebaseUser', upsertFirebaseUser);

module.exports = router;
