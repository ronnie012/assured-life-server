const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const usersCollection = client.db('assuredLife').collection('users');

const registerUser = async (req, res) => {
  const { uid, email, name, photoURL } = req.body; // Expect Firebase UID and user info from frontend

  try {
    // Check if user already exists in our DB using Firebase UID
    const existingUser = await usersCollection.findOne({ firebaseUid: uid });
    if (existingUser) {
      return res.status(200).json({ message: 'User already registered in DB', user: existingUser });
    }

    // Create new user in our MongoDB with Firebase UID
    const newUser = {
      firebaseUid: uid,
      email,
      name,
      photoURL,
      role: 'customer', // Default role
      createdAt: new Date(),
      lastLogin: new Date(),
    };
    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({ message: 'User registered successfully in DB', user: newUser });
  } catch (error) {
    console.error('Error registering user in DB:', error);
    res.status(500).json({ message: 'Server error during user registration in DB.' });
  }
};

// loginUser is no longer needed as Firebase handles authentication on the frontend.
// Backend's role is token verification via firebaseAuthMiddleware.

module.exports = { registerUser };
