const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const applicationsCollection = client.db('assuredLife').collection('applications');
const usersCollection = client.db('assuredLife').collection('users');
const policiesCollection = client.db('assuredLife').collection('policies');

const submitApplication = async (req, res) => {
  const { userId, policyId, personalData, nomineeData, healthDisclosure } = req.body;

  try {
    const newApplication = {
      userId: new ObjectId(userId),
      policyId: new ObjectId(policyId),
      personalData,
      nomineeData,
      healthDisclosure,
      status: 'Pending',
      submittedAt: new Date(),
    };

    const result = await applicationsCollection.insertOne(newApplication);
    res.status(201).json({ message: 'Application submitted successfully', applicationId: result.insertedId });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Server error during application submission.' });
  }
};

const getAllApplications = async (req, res) => {
  try {
    const applications = await applicationsCollection.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
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
  const { id } = req.params;
  const { status, feedback } = req.body;

  try {
    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, feedback, updatedAt: new Date() } }
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
  const { id } = req.params;
  const { agentId } = req.body;

  try {
    // Verify agentId exists and belongs to an agent role
    const agent = await usersCollection.findOne({ _id: new ObjectId(agentId), role: 'agent' });
    if (!agent) {
      return res.status(400).json({ message: 'Invalid agent ID or agent not found.' });
    }

    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { assignedAgentId: new ObjectId(agentId), updatedAt: new Date() } }
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
  const agentId = req.user.userId; // Get agent ID from authenticated user

  try {
    const applications = await applicationsCollection.aggregate([
      {
        $match: { assignedAgentId: new ObjectId(agentId) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
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

    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching assigned applications:', error);
    res.status(500).json({ message: 'Server error fetching assigned applications.' });
  }
};

const getUserApplications = async (req, res) => {
  const userId = req.user.uid; // Get user ID from authenticated user (Firebase UID)

  try {
    const applications = await applicationsCollection.aggregate([
      {
        $match: { 
          userId: userId,
          status: 'Approved' 
        }
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
        $lookup: {
          from: 'claims',
          let: { policyId: '$policyId', userId: '$userId' },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: [ '$policyId', '$policyId' ] }, { $eq: [ '$userId', '$userId' ] } ] } } },
            { $sort: { submittedAt: -1 } },
            { $limit: 1 }
          ],
          as: 'claimInfo'
        }
      },
      {
        $addFields: {
          claimStatus: { $ifNull: [ { $arrayElemAt: [ '$claimInfo.status', 0 ] }, 'No Claim' ] }
        }
      },
      {
        $project: {
          _id: 1,
          'policyName': '$policyInfo.title',
          status: 1,
          submittedAt: 1,
          personalData: 1,
          nomineeData: 1,
          healthDisclosure: 1,
          feedback: 1, // Include feedback
          claimStatus: 1,
        }
      },
      {
        $sort: { submittedAt: -1 }
      }
    ]).toArray();

    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({ message: 'Server error fetching user applications.' });
  }
};

module.exports = { submitApplication, getAllApplications, updateApplicationStatus, assignAgentToApplication, getAssignedApplications, getUserApplications };