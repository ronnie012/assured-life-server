const { ObjectId } = require('mongodb');
const { client } = require('../../../config/db');

const getCustomerReviews = async (req, res) => {
  const reviewsCollection = client.db('assuredLife').collection('reviews');
  console.log('Server: Attempting to fetch customer reviews.');
  try {
    const reviews = await reviewsCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    // console.log('Server: Successfully fetched customer reviews (count: '+ reviews.length + '):', reviews);
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Server Error: Error fetching customer reviews:', error);
    res.status(500).json({ message: 'Server error fetching customer reviews.' });
  }
};

const createReview = async (req, res) => {
  const reviewsCollection = client.db('assuredLife').collection('reviews');
  const { rating, message, policyId, agentId } = req.body;
  const userId = req.user.uid; // Get user ID from authenticated user (Firebase UID)
  const userName = req.user.name || req.user.email; // Get user name from authenticated user
  const userImage = req.user.picture || req.user.photoURL; // Get user image from authenticated user

  try {
    const newReview = {
      firebaseUid: userId,
      userName,
      userImage,
      rating: parseInt(rating),
      message,
      policyId: policyId ? new ObjectId(policyId) : null,
      agentId: agentId ? new ObjectId(agentId) : null,
      createdAt: new Date(),
    };

    await reviewsCollection.insertOne(newReview);
    res.status(201).json({ message: 'Review submitted successfully!' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Server error submitting review.' });
  }
};

module.exports = { getCustomerReviews, createReview };