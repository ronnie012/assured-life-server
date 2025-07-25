const admin = require('../config/firebaseAdmin');
const { client } = require('../config/db'); // Import MongoDB client

const usersCollection = client.db('assuredLife').collection('users'); // Access users collection

const firebaseAuthMiddleware = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  console.log('Middleware: Received ID Token (first 100 chars):', idToken ? idToken.substring(0, 100) + '...' : 'None');

  if (!idToken) {
    return res.status(401).send('Unauthorized: No token provided.');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Middleware: Decoded Firebase UID:', decodedToken.uid);
    
    // Fetch user role from MongoDB
    const user = await usersCollection.findOne({ firebaseUid: decodedToken.uid });
    console.log('Middleware: User fetched from DB:', user);

    if (!user) {
      console.log('Middleware: User not found in database for Firebase UID:', decodedToken.uid);
      return res.status(404).send('User not found in database.');
    }

    req.user = { ...decodedToken, role: user.role, userId: user._id };
    console.log('Middleware: req.user object after population:', req.user);
    console.log('Middleware: req.user.userId (MongoDB _id):', req.user.userId, 'Type:', typeof req.user.userId);
    console.log('Middleware: req.user.role:', req.user.role);
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token or fetching user role:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).send('Unauthorized: Token expired.');
    } else if (error.code === 'auth/argument-error') {
      return res.status(401).send('Unauthorized: Invalid token.' );
    } else {
      return res.status(401).send('Unauthorized: Invalid token.');
    }
  }
};

module.exports = firebaseAuthMiddleware;