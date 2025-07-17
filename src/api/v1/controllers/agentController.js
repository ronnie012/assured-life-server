const Agent = require('../../../models/Agent');
const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const agentsCollection = client.db('assuredLife').collection('agents');
const usersCollection = client.db('assuredLife').collection('users');

const getAllAgents = async (req, res) => {
  try {
    const agents = await agentsCollection.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $addFields: {
          userIdObjectId: { $toObjectId: "$userId" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
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
          name: '$userInfo.name',
          photo: '$userInfo.photoURL',
          experience: 1,
          specialties: 1,
        }
      }
    ]).toArray();
    res.status(200).json(agents);
  } catch (error) {
    console.error('Error fetching all agents:', error);
    res.status(500).json({ message: 'Server error fetching all agents.' });
  }
};

const getFeaturedAgents = async (req, res) => {
  try {
    const featuredAgents = await agentsCollection.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $addFields: {
          userIdObjectId: { $toObjectId: "$userId" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
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
          name: '$userInfo.name',
          photo: '$userInfo.photoURL',
          experience: 1,
          specialties: 1,
        }
      },
      {
        $limit: 3
      }
    ]).toArray();
    res.status(200).json(featuredAgents);
  } catch (error) {
    console.error('Error fetching featured agents:', error);
    res.status(500).json({ message: 'Server error fetching featured agents.' });
  }
};

const getAgentApplications = async (req, res) => {
  console.log('Server: Attempting to fetch pending agent applications.');
  try {
    const pendingAgents = await agentsCollection.aggregate([
      {
        $match: { status: 'pending' }
      },
      {
        $addFields: {
          userIdObjectId: { $toObjectId: "$userId" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
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
          name: '$userName',
          photo: 1,
          experience: 1,
          specialties: 1,
          status: 1,
          'userEmail': '$userInfo.email',
          'userId': '$userInfo._id',
        }
      }
    ]).toArray();
    console.log('Server: Fetched pending agent applications. Count:', pendingAgents.length);
    console.log('Server: Pending agent applications data:', pendingAgents); // Log the fetched data
    res.status(200).json(pendingAgents);
  } catch (error) {
    console.error('Server Error: Error fetching agent applications:', error);
    res.status(500).json({ message: 'Server error fetching agent applications.' });
  }
};

const approveAgentApplication = async (req, res) => {
  const { id } = req.params; // This is the _id of the agent application document
  const { userId } = req.body; // This is the userId associated with the application

  try {
    // Find the agent application to get experience and specialties
    const agentApplication = await agentsCollection.findOne({ _id: new ObjectId(id) });

    if (!agentApplication) {
      return res.status(404).json({ message: 'Agent application not found.' });
    }

    // Update the user's role in the usersCollection
    const userUpdateResult = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: 'agent', updatedAt: new Date() } }
    );

    if (userUpdateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found for this agent application.' });
    }

    // Now, update or create the main agent entry in agentsCollection using userId
    await agentsCollection.updateOne(
      { userId: new ObjectId(userId) }, // Use userId to identify the agent profile
      {
        $set: {
          status: 'approved',
          userName: agentApplication.userName, // Use userName from application
          userEmail: agentApplication.userEmail, // Use userEmail from application
          experience: agentApplication.experience,
          specialties: agentApplication.specialties,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          userId: new ObjectId(userId), // Ensure userId is set on insert
        },
      },
      { upsert: true } // Create if not exists
    );

    // Optionally, delete the original pending application document if it's no longer needed
        await agentsCollection.deleteOne({ _id: new ObjectId(id) });

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
  console.log('Server: Attempting to fetch all approved agents.');
  try {
    const approvedAgents = await agentsCollection.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $addFields: {
          userIdObjectId: { $toObjectId: "$userId" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
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
          'name': '$userInfo.name',
          photo: '$userInfo.photoURL',
          experience: '$experience',
          specialties: '$specialties',
          status: 1,
          'userEmail': '$userInfo.email',
          'userId': '$userInfo._id',
        }
      }
    ]).toArray();
    console.log('Server: Fetched approved agents. Count:', approvedAgents.length);
    console.log('Server: Approved agents data (full):', JSON.stringify(approvedAgents, null, 2));
    res.status(200).json(approvedAgents);
  } catch (error) {
    console.error('Server Error: Error fetching approved agents:', error);
    res.status(500).json({ message: 'Server error fetching approved agents.' });
  }
};

const submitAgentApplication = async (req, res) => {
  try {
    const { userId, userName, userEmail, experience, specialties, motivation } = req.body;

    // Ensure specialties is an array, convert if it's a comma-separated string
    const parsedSpecialties = Array.isArray(specialties) 
      ? specialties 
      : specialties.split(',').map(s => s.trim());

    const newApplication = {
      userId: new ObjectId(userId), // Convert userId to ObjectId
      userName,
      userEmail,
      experience,
      specialties: parsedSpecialties,
      motivation,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await agentsCollection.insertOne(newApplication);
    res.status(201).json({ message: 'Agent application submitted successfully!', insertedId: result.insertedId });
  } catch (error) {
    console.error('Error submitting agent application:', error);
    res.status(500).json({ message: 'Server error submitting agent application.' });
  }
};

module.exports = { getFeaturedAgents, getAgentApplications, approveAgentApplication, rejectAgentApplication, getAllApprovedAgents, getAllAgents, submitAgentApplication };