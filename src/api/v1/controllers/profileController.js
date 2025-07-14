const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const usersCollection = client.db('assuredLife').collection('users');

const getUserProfile = async (req, res) => {
  const userId = req.user.uid; // Get user ID from authenticated user (Firebase UID)
  console.log('Backend: Fetching profile for Firebase UID:', userId);

  try {
    const user = await usersCollection.findOne({ firebaseUid: userId }, { projection: { password: 0 } }); // Exclude password
    console.log('Backend: User found in DB:', user ? user.email : 'Not found');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

const updateProfile = async (req, res) => {
    const userId = req.user.uid;
  const { name, photoURL } = req.body;

  console.log('Update Profile Request:', { userId, name, photoURL });

  try {
    const updateFields = {
      name,
      updatedAt: new Date(),
    };

    // Only update photoURL if it's provided and not an empty string
    if (photoURL) {
      updateFields.photoURL = photoURL;
    }

    const updatedUser = await usersCollection.findOneAndUpdate(
      { firebaseUid: userId },
      { $set: updateFields },
      { returnDocument: 'after', projection: { password: 0 } } // Return the updated document, exclude password
    );

    console.log('MongoDB findOneAndUpdate result:', updatedUser);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json(updatedUser); // Return the updated user object
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
};

module.exports = { getUserProfile, updateProfile };
