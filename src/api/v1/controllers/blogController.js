const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const getAllBlogs = async (req, res) => {
  const blogsCollection = client.db('assuredLife').collection('blogs');
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const skip = (page - 1) * limit;
  const searchTerm = req.query.search || '';

  try {
    const query = {};
    if (searchTerm) {
      query.title = { $regex: searchTerm, $options: 'i' };
    }

    const blogs = await blogsCollection.find(query).sort({ publishDate: -1 }).skip(skip).limit(limit).toArray();
    const totalBlogs = await blogsCollection.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limit);

    res.status(200).json({ blogs, totalBlogs, totalPages });
  } catch (error) {
    console.error('Error fetching all blogs:', error);
    res.status(500).json({ message: 'Server error fetching all blogs.' });
  }
};

const getBlogById = async (req, res) => {
  const blogsCollection = client.db('assuredLife').collection('blogs');
  const { id } = req.params;
  try {
    const blog = await blogsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { totalVisit: 1 } },
      { returnDocument: 'after' }
    );

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }
    res.status(200).json(blog);
  } catch (error) {
    console.error('Error fetching blog by ID:', error);
    res.status(500).json({ message: 'Server error fetching blog by ID.' });
  }
};

const getLatestBlogs = async (req, res) => {
  const blogsCollection = client.db('assuredLife').collection('blogs');
  try {
    const blogs = await blogsCollection.find({}).sort({ publishDate: -1 }).limit(4).toArray();
    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching latest blogs:', error);
    res.status(500).json({ message: 'Server error fetching latest blogs.' });
  }
};

const createBlog = async (req, res) => {
  const blogsCollection = client.db('assuredLife').collection('blogs');
  const { title, content, blogImage } = req.body;
  const authorId = req.user.uid;
  let authorName = req.user.displayName || req.user.name;
  if (!authorName) {
    const usersCollection = client.db('assuredLife').collection('users');
    const userDoc = await usersCollection.findOne({ firebaseUid: authorId });
    authorName = userDoc?.name || req.user.email;
  }

  if (!authorName) {
    return res.status(400).json({ message: 'User name not available. Cannot create blog post.' });
  }

  try {
    const newBlog = {
      title,
      content,
      blogImage: blogImage || '',
      authorId: authorId,
      author: authorName,
      publishDate: new Date(),
      totalVisit: 0,
    };

    const result = await blogsCollection.insertOne(newBlog);
    res.status(201).json({ message: 'Blog post created successfully', blogId: result.insertedId });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ message: 'Server error creating blog post.' });
  }
};

const getAgentBlogs = async (req, res) => {
  const blogsCollection = client.db('assuredLife').collection('blogs');
  const { uid, role } = req.user;
  
  try {
    const query = {};
    if (role === 'agent') {
      query.authorId = uid;
    }

    const blogs = await blogsCollection.find(query).sort({ publishDate: -1 }).toArray();
    res.status(200).json({ blogs });
  } catch (error) {
    console.error('[getAgentBlogs] An error occurred:', error);
    res.status(500).json({ message: 'Server error while fetching blogs.' });
  }
};

const updateBlog = async (req, res) => {
  const blogsCollection = client.db('assuredLife').collection('blogs');
  const { id } = req.params;
  const { title, content, blogImage } = req.body;
  const { uid, role } = req.user;

  try {
    let query = { _id: new ObjectId(id) };

    // If the user is not an admin, they can only update their own blogs
    if (role !== 'admin') {
      query.authorId = uid;
    }

    const result = await blogsCollection.updateOne(
      query,
      { $set: { title, content, blogImage, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Blog post not found or you are not authorized to update it.' });
    }
    res.status(200).json({ message: 'Blog post updated successfully.' });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ message: 'Server error updating blog post.' });
  }
};

const deleteBlog = async (req, res) => {
  const blogsCollection = client.db('assuredLife').collection('blogs');
  const { id } = req.params;
  const { uid, role } = req.user;

  try {
    let query = { _id: new ObjectId(id) };

    if (role !== 'admin') {
      query.authorId = uid;
    }

    const result = await blogsCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Blog post not found or you are not authorized to delete it.' });
    }
    res.status(200).json({ message: 'Blog post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Server error deleting blog post.' });
  }
};

module.exports = { getAllBlogs, getBlogById, getLatestBlogs, createBlog, getAgentBlogs, updateBlog, deleteBlog };
