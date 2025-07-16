const express = require('express');
const { getFeaturedAgents, getAgentApplications, approveAgentApplication, rejectAgentApplication, getAllApprovedAgents, getAllAgents, submitAgentApplication } = require('../controllers/agentController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.get('/featured', getFeaturedAgents);
router.get('/', getAllAgents);

// Admin/Agent Management Routes
router.get('/applications', firebaseAuthMiddleware, checkRole(['admin']), getAgentApplications);
router.put('/applications/:id/approve', firebaseAuthMiddleware, checkRole(['admin']), approveAgentApplication);
router.put('/applications/:id/reject', firebaseAuthMiddleware, checkRole(['admin']), rejectAgentApplication);
router.get('/approved', firebaseAuthMiddleware, checkRole(['admin']), getAllApprovedAgents);
router.post('/applications', firebaseAuthMiddleware, submitAgentApplication);

module.exports = router;