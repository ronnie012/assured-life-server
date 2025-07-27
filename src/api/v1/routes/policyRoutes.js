const express = require('express');
const { getPopularPolicies, getAllPolicies, getPolicyById, createPolicy, updatePolicy, deletePolicy, getAppliedPoliciesForUser } = require('../controllers/policyController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();
// console.log('policyRoutes: Router initialized.');

router.get('/popular', getPopularPolicies);
router.get('/', getAllPolicies);
router.get('/:id', (req, res, next) => {
  // console.log('policyRoutes: Hit /:id route with ID:', req.params.id);
  getPolicyById(req, res, next);
});
router.post('/', firebaseAuthMiddleware, checkRole(['admin']), createPolicy);
router.put('/:id', firebaseAuthMiddleware, checkRole(['admin']), updatePolicy);
router.delete('/:id', firebaseAuthMiddleware, checkRole(['admin']), deletePolicy);

module.exports = router;