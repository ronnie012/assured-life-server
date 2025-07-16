const express = require('express');
const { getPopularPolicies, getAllPolicies, getPolicyById, createPolicy, updatePolicy, deletePolicy, getAppliedPoliciesForUser } = require('../controllers/policyController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.get('/popular', getPopularPolicies);
router.get('/', getAllPolicies);
router.get('/my-policies', firebaseAuthMiddleware, checkRole(['customer']), getAppliedPoliciesForUser);
router.get('/:id', getPolicyById);
router.post('/', firebaseAuthMiddleware, checkRole(['admin']), createPolicy);
router.put('/:id', firebaseAuthMiddleware, checkRole(['admin']), updatePolicy);
router.delete('/:id', firebaseAuthMiddleware, checkRole(['admin']), deletePolicy);

module.exports = router;