const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const blogsCollection = client.db('assuredLife').collection('blogs');

const getLatestBlogs = async (req, res) => {
  try {
    const blogs = await blogsCollection.find({}).sort({ publishDate: -1 }).limit(4).toArray();
    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching latest blogs:', error);
    res.status(500).json({ message: 'Server error fetching latest blogs.' });
  }
};

const createBlog = async (req, res) => {
  const { title, content } = req.body;
  const authorId = req.user.uid; // Get author ID from authenticated user (Firebase UID)
  const authorName = req.user.name || req.user.email; // Get author name from authenticated user

  try {
    const newBlog = {
      title,
      content,
      authorId: authorId,
      author: authorName,
      publishDate: new Date(),
    };

    const result = await blogsCollection.insertOne(newBlog);
    res.status(201).json({ message: 'Blog post created successfully', blogId: result.insertedId });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ message: 'Server error creating blog post.' });
  }
};

const getAgentBlogs = async (req, res) => {
  const agentId = req.user.uid; // Get agent ID from authenticated user (Firebase UID)

  try {
    const blogs = await blogsCollection.find({ authorId: agentId }).sort({ publishDate: -1 }).toArray();
    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching agent blogs:', error);
    res.status(500).json({ message: 'Server error fetching agent blogs.' });
  }
};

const updateBlog = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const authorId = req.user.uid;

  try {
    const result = await blogsCollection.updateOne(
      { _id: new ObjectId(id), authorId: authorId }, // Ensure only author can update
      { $set: { title, content, updatedAt: new Date() } }
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
  const { id } = req.params;
  const authorId = req.user.uid;

  try {
    const result = await blogsCollection.deleteOne(
      { _id: new ObjectId(id), authorId: authorId } // Ensure only author can delete
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Blog post not found or you are not authorized to delete it.' });
    }
    res.status(200).json({ message: 'Blog post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Server error deleting blog post.' });
  }
};

module.exports = { getLatestBlogs, createBlog, getAgentBlogs, updateBlog, deleteBlog };