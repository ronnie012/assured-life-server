const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const applicationsCollection = client.db('assuredLife').collection('applications');
const usersCollection = client.db('assuredLife').collection('users');

const getAppliedPoliciesForUser = async (req, res) => {
  const userId = req.user.uid; // Get user ID from authenticated user (Firebase UID)
  console.log('Fetching applied policies for Firebase UID:', userId);

  try {
    // Find the user's _id from the users collection using firebaseUid
    const user = await usersCollection.findOne({ firebaseUid: userId });
    console.log('User found in DB:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found in database.' });
    }

    console.log('Matching applications for MongoDB _id:', user._id);
    const applications = await applicationsCollection.aggregate([
      {
        $match: { userId: user._id }
      },
      {
        $lookup: {
          from: 'policies',
          localField: 'policyId',
          foreignField: '_id',
          as: 'policyInfo'
        }
      },
      {
        $unwind: '$policyInfo'
      },
      {
        $project: {
          _id: 1,
          status: 1,
          submittedAt: 1,
          policyDetails: '$policyInfo',
        }
      },
      {
        $sort: { submittedAt: -1 }
      }
    ]).toArray();

    console.log('Applications found:', applications);
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applied policies for user:', error);
    res.status(500).json({ message: 'Server error fetching applied policies.' });
  }
};

module.exports = { getAppliedPoliciesForUser };
