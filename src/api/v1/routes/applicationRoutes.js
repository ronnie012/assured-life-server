const express = require('express');
const { submitApplication, getAllApplications, updateApplicationStatus, assignAgentToApplication, getAssignedApplications, getUserApplications, getApplicationById } = require('../controllers/applicationController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.post('/submit', submitApplication);
router.get('/', firebaseAuthMiddleware, checkRole(['admin']), getAllApplications);
router.put('/:id/status', firebaseAuthMiddleware, checkRole(['admin', 'agent', 'customer']), updateApplicationStatus);
router.put('/:id/assign-agent', firebaseAuthMiddleware, checkRole(['admin']), assignAgentToApplication);
router.get('/assigned', firebaseAuthMiddleware, checkRole(['agent']), getAssignedApplications);
router.get('/my-applications', firebaseAuthMiddleware, checkRole(['customer']), getUserApplications);
router.get('/:id', firebaseAuthMiddleware, checkRole(['admin', 'agent', 'customer']), getApplicationById);

module.exports = router;
