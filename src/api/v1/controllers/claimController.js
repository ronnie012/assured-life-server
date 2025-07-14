const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const claimsCollection = client.db('life-insurance').collection('claims');
const applicationsCollection = client.db('assuredLife').collection('applications');

const submitClaim = async (req, res) => {
  const { policyId, reason, documents } = req.body;
  const userId = req.user.uid; // From authenticated user (Firebase UID)

  try {
    // Optional: Verify if the policy is active for the user
    const application = await applicationsCollection.findOne({
      userId: new ObjectId(userId),
      policyId: new ObjectId(policyId),
      status: 'Approved', // Only allow claims for approved policies
    });

    if (!application) {
      return res.status(400).json({ message: 'Policy not found or not active for this user.' });
    }

    const newClaim = {
      userId: new ObjectId(userId),
      policyId: new ObjectId(policyId),
      reason,
      documents: documents || [],
      status: 'Pending',
      submittedAt: new Date(),
    };

    await claimsCollection.insertOne(newClaim);
    res.status(201).json({ message: 'Claim submitted successfully!' });
  } catch (error) {
    console.error('Error submitting claim:', error);
    res.status(500).json({ message: 'Server error submitting claim.' });
  }
};

module.exports = { submitClaim };
