const express = require('express');
const { getAllUsers, updateUserRole, upsertFirebaseUser, deleteUser } = require('../controllers/userController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.get('/', firebaseAuthMiddleware, checkRole(['admin']), getAllUsers);
router.put('/:id/role', firebaseAuthMiddleware, checkRole(['admin']), updateUserRole);
router.post('/upsertFirebaseUser', upsertFirebaseUser);
router.delete('/:id', firebaseAuthMiddleware, checkRole(['admin']), deleteUser);

module.exports = router;