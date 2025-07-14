const express = require('express');
const { getAllFAQs } = require('../controllers/faqController');

const router = express.Router();

router.get('/', getAllFAQs);

module.exports = router;
