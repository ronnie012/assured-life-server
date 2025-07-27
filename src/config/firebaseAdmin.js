const admin = require('firebase-admin');
const path = require('path');

try {
    let serviceAccount;
    if (process.env.NODE_ENV === 'production') {
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccountString) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not defined in environment variables for production.');
        }
        try {
            serviceAccount = JSON.parse(serviceAccountString);
        } catch (parseError) {
            throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ' + parseError.message);
        }
    } else {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        if (!serviceAccountPath) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not defined in .env for local development.');
        }
        serviceAccount = require(path.resolve(serviceAccountPath));
    }

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} catch (error) {
    console.error('Firebase Admin Initialization Error (Caught):', error);
    process.exit(1);
}

module.exports = admin;
