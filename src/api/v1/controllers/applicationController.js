const { ObjectId } = require('mongodb');
const { client } = require('../../../config/db');

const submitApplication = async (req, res) => {
  const applicationsCollection = client.db('assuredLife').collection('applications');
  const { userId, policyId, personalData, nomineeData, healthDisclosure, quoteData } = req.body;

  try {
    const newApplication = {
      userId: userId, // Store as string (Firebase UID)
      policyId: new ObjectId(policyId),
      personalData,
      nomineeData,
      healthDisclosure,
      quoteData, // Add this line
      status: 'Pending', // Ensure status is Pending on submission
      paymentStatus: 'Unpaid', // Initialize payment status
      submittedAt: new Date(),
    };

    console.log('Backend: Inserting new application:', newApplication);
    const result = await applicationsCollection.insertOne(newApplication);
    console.log('Backend: Application insert result:', result);
    res.status(201).json({ message: 'Application submitted successfully', applicationId: result.insertedId });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Server error during application submission.' });
  }
};

const getAllApplications = async (req, res) => {
  const applicationsCollection = client.db('assuredLife').collection('applications');
  try {
    const applications = await applicationsCollection.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: 'firebaseUid',
          as: 'applicantInfo'
        }
      },
      {
        $unwind: '$applicantInfo'
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
          'applicantName': '$applicantInfo.name',
          'applicantEmail': '$applicantInfo.email',
          'policyName': '$policyInfo.title',
          status: 1,
          submittedAt: 1,
          assignedAgentId: 1, // Include assigned agent ID
          personalData: 1, // For view details
          nomineeData: 1, // For view details
          healthDisclosure: 1, // For view details
        }
      },
      {
        $sort: { submittedAt: -1 }
      }
    ]).toArray();

    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({ message: 'Server error fetching applications.' });
  }
};

const updateApplicationStatus = async (req, res) => {
  const applicationsCollection = client.db('assuredLife').collection('applications');
  const policiesCollection = client.db('assuredLife').collection('policies');
  const { id } = req.params;
  const { status, feedback, policyId } = req.body;

  try {
    const updateDoc = { $set: { status, feedback, updatedAt: new Date() } };

    if (status === 'Paid' && policyId) {
      updateDoc.$set.paymentStatus = 'Paid';
      // Increment purchase count for the policy
      await policiesCollection.updateOne(
        { _id: new ObjectId(policyId) },
        { $inc: { purchaseCount: 1 } }
      );
    }

    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    res.status(200).json({ message: 'Application status updated successfully.' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Server error updating application status.' });
  }
};

const assignAgentToApplication = async (req, res) => {
  const applicationsCollection = client.db('assuredLife').collection('applications');
  const usersCollection = client.db('assuredLife').collection('users');
  const agentsCollection = client.db('assuredLife').collection('agents');
  const { id } = req.params;
  const { agentId } = req.body;

  try {
    // 1. Find the agent document in the agents collection using the provided agentId
    const agentDoc = await agentsCollection.findOne({ _id: new ObjectId(agentId) });

    if (!agentDoc) {
      return res.status(400).json({ message: 'Agent document not found in agents collection.' });
    }

    // 2. Get the actual userId (ObjectId) from the found agent document
    const actualAgentUserId = agentDoc.userId;

    // 3. Verify this actualAgentUserId exists in the users collection and has the 'agent' role
    const agentUser = await usersCollection.findOne({ _id: actualAgentUserId, role: 'agent' });

    if (!agentUser) {
      return res.status(400).json({ message: 'Invalid agent ID or agent not found in users collection with agent role.' });
    }

    // 4. Update the application with the assigned agent's _id (from the users collection)
    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { assignedAgentId: actualAgentUserId, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    res.status(200).json({ message: 'Agent assigned to application successfully.' });
  } catch (error) {
    console.error('Error assigning agent to application:', error);
    res.status(500).json({ message: 'Server error assigning agent.' });
  }
};

const getAssignedApplications = async (req, res) => {
  const applicationsCollection = client.db('assuredLife').collection('applications');
  const agentId = req.user.userId; // Get agent ID from authenticated user
  console.log('Backend: getAssignedApplications - agentId from req.user:', agentId);

  try {
    const applications = await applicationsCollection.aggregate([
      {
        $match: { assignedAgentId: new ObjectId(agentId) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: 'firebaseUid',
          as: 'applicantInfo'
        }
      },
      {
        $unwind: '$applicantInfo'
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
          'applicantName': '$applicantInfo.name',
          'applicantEmail': '$applicantInfo.email',
          'policyName': '$policyInfo.title',
          status: 1,
          submittedAt: 1,
          personalData: 1, // For view details
          nomineeData: 1, // For view details
          healthDisclosure: 1, // For view details
        }
      },
      {
        $sort: { submittedAt: -1 }
      }
    ]).toArray();
    console.log('Backend: getAssignedApplications - fetched applications:', applications);

    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching assigned applications:', error);
    res.status(500).json({ message: 'Server error fetching assigned applications.' });
  }
};

const getUserApplications = async (req, res) => {
  const applicationsCollection = client.db('assuredLife').collection('applications');
  const userId = req.user.uid; // Get user ID from authenticated user (Firebase UID)

  try {
    const applications = await applicationsCollection.aggregate([
      {
        $match: { userId: userId }
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
          feedback: 1,
          claimStatus: 1,
          personalData: 1,
          nomineeData: 1,
          healthDisclosure: 1,
          policyName: '$policyInfo.title',
          policyInfo: '$policyInfo',
          quoteData: '$quoteData',
          paymentStatus: '$paymentStatus' // Include paymentStatus
        }
      },
      {
        $sort: { submittedAt: -1 }
      }
    ]).toArray();
    console.log('Backend: User applications fetched:', JSON.stringify(applications, null, 2));
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({ message: 'Server error fetching user applications.' });
  }
};

module.exports = { submitApplication, getAllApplications, updateApplicationStatus, assignAgentToApplication, getAssignedApplications, getUserApplications };