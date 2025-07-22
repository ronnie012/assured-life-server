const express = require('express');
const { getAllBlogs, getLatestBlogs, createBlog, getAgentBlogs, updateBlog, deleteBlog, getBlogById } = require('../controllers/blogController');
const firebaseAuthMiddleware = require('../../../middlewares/firebaseAuthMiddleware');
const checkRole = require('../../../middlewares/roleCheckMiddleware');

const router = express.Router();

// Public routes
router.get('/latest', getLatestBlogs);

router.get('/agent', firebaseAuthMiddleware, checkRole(['agent', 'admin']), getAgentBlogs); 
router.get('/', getAllBlogs);
router.get('/:id', getBlogById); 

// Blog modification routes for agents and admins
router.post('/', firebaseAuthMiddleware, checkRole(['agent', 'admin']), createBlog);
router.put('/:id', firebaseAuthMiddleware, checkRole(['agent', 'admin']), updateBlog);
router.delete('/:id', firebaseAuthMiddleware, checkRole(['agent', 'admin']), deleteBlog);

module.exports = router;
