const { ObjectId } = require('mongodb');
const { client } = require('../../../config/db');

const getPopularPolicies = async (req, res) => {
  const policiesCollection = client.db('assuredLife').collection('policies');
  console.log('Server: Attempting to fetch popular policies.');
  try {
    const popularPolicies = await policiesCollection.find({}).sort({ purchaseCount: -1 }).limit(6).toArray();
    console.log('Server: Fetched popular policies data (count: '+ popularPolicies.length + '):', popularPolicies);
    res.status(200).json(popularPolicies);
  } catch (error) {
    console.error('Server Error: Error fetching popular policies:', error);
    res.status(500).json({ message: 'Server error fetching popular policies.' });
  }
};

const getAllPolicies = async (req, res) => {
  const policiesCollection = client.db('assuredLife').collection('policies');
  console.log('Server: Attempting to fetch all policies.');
  try {
    const page = parseInt(req.query.page) || 1;
    // If limit is explicitly set to '0', we fetch all. Otherwise, we paginate with a default of 9.
    const limit = req.query.limit === '0' ? 0 : parseInt(req.query.limit) || 9;
    const category = req.query.category;
    const search = req.query.search;

    let query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    const totalPolicies = await policiesCollection.countDocuments(query);
    let policiesCursor = policiesCollection.find(query);
    let totalPages = 1;

    // Apply pagination only if a limit is set and greater than 0
    if (limit > 0) {
      const skip = (page - 1) * limit;
      policiesCursor = policiesCursor.skip(skip).limit(limit);
      totalPages = Math.ceil(totalPolicies / limit);
    }

    const policies = await policiesCursor.toArray();

    console.log('Server: Fetched policies. Count:', policies.length);
    console.log('Server: Total policies:', totalPolicies);
    console.log('Server: Policies data:', policies);

    res.status(200).json({
      policies,
      totalPolicies,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error('Server Error: Error fetching all policies:', error);
    res.status(500).json({ message: 'Server error fetching all policies.' });
  }
};

const getPolicyById = async (req, res) => {
  const policiesCollection = client.db('assuredLife').collection('policies');
  console.log('Server: getPolicyById function entered. ID:', req.params.id);
  try {
    const policy = await policiesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found.' });
    }
    res.status(200).json(policy);
  } catch (error) {
    console.error('Error fetching policy by ID:', error);
    res.status(500).json({ message: 'Server error fetching policy.' });
  }
};

const createPolicy = async (req, res) => {
  const policiesCollection = client.db('assuredLife').collection('policies');
  const { title, category, description, minAge, maxAge, coverageRange, durationOptions, basePremiumRate, policyImage } = req.body;

  try {
    const newPolicy = {
      title,
      category,
      description,
      minAge: parseInt(minAge),
      maxAge: parseInt(maxAge),
      coverageRange,
      durationOptions,
      basePremiumRate: parseFloat(basePremiumRate),
      policyImage,
      purchaseCount: 0, // New policies start with 0 purchases
      createdAt: new Date(),
    };

    const result = await policiesCollection.insertOne(newPolicy);
    res.status(201).json({ message: 'Policy created successfully', policyId: result.insertedId });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ message: 'Server error creating policy.' });
  }
};

const updatePolicy = async (req, res) => {
  const policiesCollection = client.db('assuredLife').collection('policies');
  const { id } = req.params;
  const { title, category, description, minAge, maxAge, coverageRange, durationOptions, basePremiumRate, policyImage } = req.body;

  try {
    const updatedPolicy = {
      title,
      category,
      description,
      minAge: parseInt(minAge),
      maxAge: parseInt(maxAge),
      coverageRange,
      durationOptions,
      basePremiumRate: parseFloat(basePremiumRate),
      policyImage,
      updatedAt: new Date(),
    };

    const result = await policiesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedPolicy }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Policy not found.' });
    }
    res.status(200).json({ message: 'Policy updated successfully.' });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ message: 'Server error updating policy.' });
  }
};

const deletePolicy = async (req, res) => {
  const policiesCollection = client.db('assuredLife').collection('policies');
  const { id } = req.params;

  try {
    const result = await policiesCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Policy not found.' });
    }
    res.status(200).json({ message: 'Policy deleted successfully.' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ message: 'Server error deleting policy.' });
  }
};

const getAppliedPoliciesForUser = async (req, res) => {
  const applicationsCollection = client.db('assuredLife').collection('applications');
  const usersCollection = client.db('assuredLife').collection('users');
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

    // console.log('Applications found:', applications);
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applied policies for user:', error);
    res.status(500).json({ message: 'Server error fetching applied policies.' });
  }
};

module.exports = { getPopularPolicies, getAllPolicies, getPolicyById, createPolicy, updatePolicy, deletePolicy, getAppliedPoliciesForUser };
