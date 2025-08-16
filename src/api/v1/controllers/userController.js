const { ObjectId } = require('mongodb');
const { client } = require('../../../config/db');

const getAllUsers = async (req, res) => {
  const usersCollection = client.db('assuredLifeDbUpgraded').collection('users');
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
  const usersCollection = client.db('assuredLifeDbUpgraded').collection('users');
  const agentsCollection = client.db('assuredLifeDbUpgraded').collection('agents');
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
  const usersCollection = client.db('assuredLifeDbUpgraded').collection('users');
  const { uid, email, name, photoURL } = req.body;
  console.log('Server: upsertFirebaseUser - Request Body:', req.body);

  try {
    const filter = { firebaseUid: uid };
    
    // Start with the fields that are always updated
    const updateDoc = {
      $set: {
        email,
        lastLogin: new Date(),
      },
      $setOnInsert: {
        firebaseUid: uid,
        role: 'customer',
        createdAt: new Date(),
      },
    };

    // Only add name to the document if it's provided.
    // For new users, it will be set on insert. For existing users, it will be updated.
    if (name) {
      updateDoc.$set.name = name;
    } else {
      // If a new user is created without a name (e.g. from some old client), default it.
      updateDoc.$setOnInsert.name = email.split('@')[0];
    }

    // Only add photoURL to the document if it's provided.
    if (photoURL) {
      updateDoc.$set.photoURL = photoURL;
    }

    const options = { upsert: true, returnDocument: 'after' };
    const result = await usersCollection.findOneAndUpdate(filter, updateDoc, options);

    console.log('Server: findOneAndUpdate result:', result);
    if (result && result.value) {
      console.log('Server: upsertFirebaseUser - Result Value:', result.value);
      res.status(200).json(result.value);
    } else {
      // If findOneAndUpdate returns null or result.value is null/undefined, but upserted, we might need to query again
      // However, with returnDocument: 'after', it should return the new doc.
      // This case handles unexpected null returns or cases where value is not directly available.
      const newUser = await usersCollection.findOne(filter);
      if(newUser) {
        console.log('Server: upsertFirebaseUser - New User (after re-query):', newUser);
        res.status(200).json(newUser);
      } else {
        res.status(500).json({ message: 'Failed to upsert user data and could not retrieve the user.' });
      }
    }
  } catch (error) {
    console.error('Error upserting Firebase user:', error);
    res.status(500).json({ message: 'Server error during user upsert.' });
  }
};

const deleteUser = async (req, res) => {
  const usersCollection = client.db('assuredLifeDbUpgraded').collection('users');
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