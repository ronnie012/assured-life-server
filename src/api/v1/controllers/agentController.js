const Agent = require('../../../models/Agent');
const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const agentsCollection = client.db('life-insurance').collection('agents');
const usersCollection = client.db('assuredLife').collection('users');

const getAllAgents = async (req, res) => {
  try {
    const agents = await agentsCollection.find({ status: 'approved' }).toArray();
    res.status(200).json(agents);
  } catch (error) {
    console.error('Error fetching all agents:', error);
    res.status(500).json({ message: 'Server error fetching all agents.' });
  }
};

const getFeaturedAgents = async (req, res) => {
  try {
    // Fetch 3 agents with status 'approved'
    const featuredAgents = await agentsCollection.find({ status: 'approved' }).limit(3).toArray();
    res.status(200).json(featuredAgents);
  } catch (error) {
    console.error('Error fetching featured agents:', error);
    res.status(500).json({ message: 'Server error fetching featured agents.' });
  }
};

const getAgentApplications = async (req, res) => {
  try {
    const pendingAgents = await agentsCollection.aggregate([
      {
        $match: { status: 'pending' }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 1,
          name: 1,
          photo: 1,
          experience: 1,
          specialties: 1,
          status: 1,
          'userEmail': '$userInfo.email',
          'userId': '$userInfo._id',
        }
      }
    ]).toArray();
    res.status(200).json(pendingAgents);
  } catch (error) {
    console.error('Error fetching agent applications:', error);
    res.status(500).json({ message: 'Server error fetching agent applications.' });
  }
};

const approveAgentApplication = async (req, res) => {
  const { id } = req.params; // Agent application ID
  const { userId } = req.body; // User ID associated with the agent application

  try {
    // Update agent application status
    const agentUpdateResult = await agentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved', updatedAt: new Date() } }
    );

    if (agentUpdateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Agent application not found.' });
    }

    // Update user role to 'agent'
    const userUpdateResult = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: 'agent', updatedAt: new Date() } }
    );

    if (userUpdateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found for this agent application.' });
    }

    res.status(200).json({ message: 'Agent application approved and user role updated.' });
  } catch (error) {
    console.error('Error approving agent application:', error);
    res.status(500).json({ message: 'Server error approving agent application.' });
  }
};

const rejectAgentApplication = async (req, res) => {
  const { id } = req.params; // Agent application ID
  const { feedback } = req.body; // Optional feedback for rejection

  try {
    const result = await agentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'rejected', feedback, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Agent application not found.' });
    }
    res.status(200).json({ message: 'Agent application rejected.' });
  } catch (error) {
    console.error('Error rejecting agent application:', error);
    res.status(500).json({ message: 'Server error rejecting agent application.' });
  }
};

const getAllApprovedAgents = async (req, res) => {
  try {
    const approvedAgents = await agentsCollection.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 1,
          name: 1,
          photo: 1,
          experience: 1,
          specialties: 1,
          status: 1,
          'userEmail': '$userInfo.email',
          'userId': '$userInfo._id',
        }
      }
    ]).toArray();
    res.status(200).json(approvedAgents);
  } catch (error) {
    console.error('Error fetching approved agents:', error);
    res.status(500).json({ message: 'Server error fetching approved agents.' });
  }
};

module.exports = { getFeaturedAgents, getAgentApplications, approveAgentApplication, rejectAgentApplication, getAllApprovedAgents, getAllAgents };