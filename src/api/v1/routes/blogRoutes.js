const express = require('express');
const { getLatestBlogs, createBlog, getAgentBlogs, updateBlog, deleteBlog, getAllBlogs, getBlogById } = require('../controllers/blogController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

router.get('/latest', getLatestBlogs);
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);

// Agent Blog Management Routes
router.post('/', firebaseAuthMiddleware, checkRole(['agent']), createBlog);
router.get('/agent', firebaseAuthMiddleware, checkRole(['agent']), getAgentBlogs);
router.put('/:id', firebaseAuthMiddleware, checkRole(['agent']), updateBlog);
router.delete('/:id', firebaseAuthMiddleware, checkRole(['agent']), deleteBlog);

module.exports = router;