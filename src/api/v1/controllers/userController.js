const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const usersCollection = client.db('assuredLife').collection('users');

const getAllUsers = async (req, res) => {
  try {
    const users = await usersCollection.find({}).project({ password: 0 }).toArray(); // Exclude password
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
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

module.exports = { getAllUsers, updateUserRole, upsertFirebaseUser };