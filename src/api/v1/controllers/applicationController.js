const { ObjectId } = require('mongodb');
const { client } = require('../../../config/db');

const submitApplication = async (req, res) => {
  const applicationsCollection = client.db('assuredLifeDbUpgraded').collection('applications');
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
      paymentStatus: 'Due', // Initialize payment status as 'Due'
      claimStatus: 'No Claim', // Initialize claim status
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
  const applicationsCollection = client.db('assuredLifeDbUpgraded').collection('applications');
  console.log('Backend: getAllApplications - Function entered.');
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

    console.log('Backend: getAllApplications - Fetched applications:', JSON.stringify(applications, null, 2));
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({ message: 'Server error fetching applications.' });
  }
};

const updateApplicationStatus = async (req, res) => {
  const applicationsCollection = client.db('assuredLifeDbUpgraded').collection('applications');
  const policiesCollection = client.db('assuredLifeDbUpgraded').collection('policies');
  const { id } = req.params;
  const { status, feedback, policyId } = req.body;

  try {
    const updateDoc = { $set: { status, feedback, updatedAt: new Date() } };

    if (status === 'Approved' && policyId) {
      console.log('Backend: Attempting to increment purchase count for policyId:', policyId);
      const updateResult = await policiesCollection.updateOne(
        { _id: new ObjectId(policyId) },
        { $inc: { purchaseCount: 1 } }
      );
      console.log('Backend: Policy purchase count update result:', updateResult);
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
  const applicationsCollection = client.db('assuredLifeDbUpgraded').collection('applications');
  const usersCollection = client.db('assuredLifeDbUpgraded').collection('users');
  const { id } = req.params;
  const { agentId } = req.body;

  try {
    const agentUser = await usersCollection.findOne({ _id: new ObjectId(agentId) });

    if (!agentUser) {
      return res.status(400).json({ message: 'Invalid agent ID or agent not found in users collection with agent role.' });
    }

    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { assignedAgentId: agentUser._id, updatedAt: new Date() } }
    );
    console.log('Backend: assignAgentToApplication - assignedAgentId being set:', agentUser._id);
    console.log('Backend: assignAgentToApplication - application ID being updated:', id);
    console.log('Backend: assignAgentToApplication - agentId received:', agentId);

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
  const applicationsCollection = client.db('assuredLifeDbUpgraded').collection('applications');
  const agentId = req.user.userId; // Get agent's MongoDB _id from authenticated user
  console.log('Backend: getAssignedApplications - agentId from req.user.userId:', agentId, 'Type:', typeof agentId);

  if (!agentId) {
    console.log('Backend: getAssignedApplications - agentId is missing from req.user.');
    return res.status(400).json({ message: 'Agent ID is required.' });
  }
  try {
    const objectAgentId = new ObjectId(agentId);
    console.log('Backend: getAssignedApplications - Converted agentId to ObjectId:', objectAgentId);
    const applications = await applicationsCollection.aggregate([
      {
        $match: { assignedAgentId: objectAgentId }
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
  const applicationsCollection = client.db('assuredLifeDbUpgraded').collection('applications');
  const firebaseUid = req.user.uid; // Get Firebase UID from authenticated user

  try {
    console.log('Backend: getUserApplications - Received Firebase UID:', firebaseUid);
    // Attempt to convert to ObjectId if it's a valid ObjectId string, otherwise use as string
    let userIdToMatch;
    if (ObjectId.isValid(firebaseUid)) {
      userIdToMatch = new ObjectId(firebaseUid);
      console.log('Backend: getUserApplications - Converted Firebase UID to ObjectId:', userIdToMatch);
    } else {
      userIdToMatch = firebaseUid;
      console.log('Backend: getUserApplications - Using Firebase UID as string:', userIdToMatch);
    }

    const applications = await applicationsCollection.aggregate([
      {
        $match: { userId: userIdToMatch }
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
    console.log('Backend: getUserApplications - Applications after aggregation:', JSON.stringify(applications, null, 2));
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({ message: 'Server error fetching user applications.' });
  }
};

const getApplicationById = async (req, res) => {
  const applicationsCollection = client.db('assuredLifeDbUpgraded').collection('applications');
  const { id } = req.params;
  const userId = req.user.uid; // From authenticated user (Firebase UID)

  try {
    console.log('Backend: getApplicationById - Received ID:', id);
    const objectId = new ObjectId(id);
    console.log('Backend: getApplicationById - Converted ObjectId:', objectId);
    const application = await applicationsCollection.aggregate([
      {
        $match: { _id: objectId }
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
          userId: 1, // Include userId
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
          paymentStatus: '$paymentStatus'
        }
      }
    ]).toArray();

    if (application.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // Optional: Add authorization check if needed (e.g., only owner or admin can view)
    console.log('Backend: getApplicationById - Application userId:', application[0].userId);
    console.log('Backend: getApplicationById - Authenticated userId (req.user.uid):', userId);
    console.log('Backend: getApplicationById - Authenticated user role (req.user.role):', req.user.role);
    if (application[0].userId !== userId && req.user.role !== 'admin' && req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to view this application.' });
    }

    res.status(200).json(application[0]);
  } catch (error) {
    console.error('Error fetching application by ID:', error);
    res.status(500).json({ message: 'Server error fetching application.' });
  }
};

module.exports = { submitApplication, getAllApplications, updateApplicationStatus, assignAgentToApplication, getAssignedApplications, getUserApplications, getApplicationById };