const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const usersCollection = client.db('assuredLife').collection('users');
const agentsCollection = client.db('assuredLife').collection('agents');

const getAllUsers = async (req, res) => {
  console.log('Server: Attempting to fetch all users.');
  console.log('Server: req.user in getAllUsers:', req.user); // Added logging for req.user
  try {
    const users = await usersCollection.find({}).project({ _id: 1, name: 1, email: 1, role: 1, lastLogin: 1, createdAt: 1 }).toArray(); // Explicitly include necessary fields
    console.log('Server: Successfully fetched all users. Count:', users.length);
    console.log('Server: Users data:', users); // Log full users array for inspection
    res.status(200).json(users);
  } catch (error) {
    console.error('Server Error: Error fetching all users:', error); // Log the full error object
    res.status(500).json({ message: 'Server error fetching users.', error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['customer', 'agent', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If role is updated to 'agent', ensure an entry exists in the agents collection
    if (role === 'agent') {
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      if (user) {
        // Try to find an existing agent entry for this user
        const existingAgent = await agentsCollection.findOne({ userId: new ObjectId(id) });

        const updateFields = {
          status: 'approved',
          name: user.name || user.email, // Use user's name or email
          email: user.email,
          updatedAt: new Date(),
        };

        // Only set experience and specialties if they exist in existingAgent
        if (existingAgent && existingAgent.experience !== undefined) {
          updateFields.experience = existingAgent.experience;
        } else {
          updateFields.experience = 'N/A'; // Default if no existing or undefined
        }

        if (existingAgent && existingAgent.specialties !== undefined) {
          updateFields.specialties = existingAgent.specialties;
        } else {
          updateFields.specialties = []; // Default if no existing or undefined
        }

        await agentsCollection.updateOne(
          { userId: new ObjectId(id) },
          {
            $set: updateFields,
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    } else if (role === 'customer') {
      // If role is changed to 'customer', update agent entry status to 'demoted'
      const existingAgent = await agentsCollection.findOne({ userId: new ObjectId(id) });
      console.log('Demoting agent: existingAgent found:', existingAgent);
      if (existingAgent) { // Ensure existingAgent is found before trying to use its properties
        await agentsCollection.updateOne(
          { userId: new ObjectId(id) },
          { $set: {
              status: 'demoted',
              experience: existingAgent.experience, // Directly use existing value
              specialties: existingAgent.specialties, // Directly use existing value
              updatedAt: new Date()
            }
          }
        );
        console.log('Demoting agent: Updated agent with experience:', existingAgent.experience, 'and specialties:', existingAgent.specialties);
      }
    } else {
      // For other roles (e.g., admin), ensure agent entry is removed if it exists
      await agentsCollection.deleteOne({ userId: new ObjectId(id) });
    }

    res.status(200).json({ message: 'User role updated successfully.' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error updating user role.' });
  }
};

const upsertFirebaseUser = async (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;

  const DEFAULT_AVATAR_URL = `https://www.gravatar.com/avatar/?d=mp`; // Generic Mystery Person avatar

  try {
    const filter = { firebaseUid: uid };
    const updateDoc = {
      $set: {
        email,
        lastLogin: new Date(),
      },
      $setOnInsert: {
        role: 'customer', // Default role for new users
        createdAt: new Date(),
      },
    };

    if (displayName) {
      updateDoc.$set.name = displayName;
    } else {
      updateDoc.$setOnInsert.name = email; // Set name on insert if not provided
    }

    if (photoURL) {
      updateDoc.$set.photoURL = photoURL;
    } else {
      updateDoc.$setOnInsert.photoURL = DEFAULT_AVATAR_URL; // Set default photo on insert if not provided
    }

    const options = { upsert: true, returnDocument: 'after' }; // Create if not exists, return the updated/inserted document

    const result = await usersCollection.findOneAndUpdate(filter, updateDoc, options);

    console.log('MongoDB findOneAndUpdate result:', result);

    if (result) {
      res.status(200).json(result);
    } else {
      // This case should ideally not be hit with upsert:true, but as a fallback
      res.status(500).json({ message: 'Failed to upsert user data. Result value is null.' });
    }
  } catch (error) {
    console.error('Error upserting Firebase user:', error);
    res.status(500).json({ message: 'Server error during user upsert.' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
};

module.exports = { getAllUsers, updateUserRole, upsertFirebaseUser, deleteUser };