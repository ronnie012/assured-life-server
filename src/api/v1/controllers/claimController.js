const { ObjectId } = require('mongodb');
const { client } = require('../../../config/db');

const submitClaim = async (req, res) => {
  const claimsCollection = client.db('assuredLife').collection('claims');
  const applicationsCollection = client.db('assuredLife').collection('applications');
  const { policyId, reason, documents } = req.body;
  const userId = req.user.uid; // From authenticated user (Firebase UID)

  try {
    // Optional: Verify if the policy is active for the user
    const application = await applicationsCollection.findOne({
      userId: userId,
      policyId: new ObjectId(policyId),
      status: 'Approved', // Only allow claims for approved policies
    });

    if (!application) {
      return res.status(400).json({ message: 'Policy not found or not active for this user.' });
    }

    const newClaim = {
      userId: userId, // Store as string (Firebase UID)
      policyId: new ObjectId(policyId),
      applicationId: application._id, // Store the application ID
      reason,
      documents: documents || [],
      status: 'Pending',
      submittedAt: new Date(),
    };

    await claimsCollection.insertOne(newClaim);

    // Update the claimStatus in the corresponding application to 'Pending'
    await applicationsCollection.updateOne(
      { _id: application._id },
      { $set: { claimStatus: 'Pending' } }
    );

    res.status(201).json({ message: 'Claim submitted successfully!' });
  } catch (error) {
    console.error('Error submitting claim:', error);
    res.status(500).json({ message: 'Server error submitting claim.' });
  }
};

const getAllClaims = async (req, res) => {
  const claimsCollection = client.db('assuredLife').collection('claims');
  try {
    const claims = await claimsCollection.aggregate([
      {
        $lookup: {
          from: 'applications',
          localField: 'applicationId',
          foreignField: '_id',
          as: 'applicationInfo'
        }
      },
      {
        $unwind: '$applicationInfo'
      },
      {
        $lookup: {
          from: 'policies',
          localField: 'policyId',
          foreignField: '_id',
          as: 'policyDetails'
        }
      },
      {
        $unwind: '$policyDetails'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: 'firebaseUid',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 1,
          reason: 1,
          documents: 1,
          status: 1,
          submittedAt: 1,
          policyName: '$policyDetails.title',
          policyAmount: '$applicationInfo.quoteData.coverageAmount', // Get coverage from application
          applicantName: '$userInfo.name',
          applicantEmail: '$userInfo.email',
        }
      },
      {
        $sort: { submittedAt: -1 }
      }
    ]).toArray();

    res.status(200).json(claims);
  } catch (error) {
    console.error('Error fetching all claims:', error);
    res.status(500).json({ message: 'Server error fetching claims.' });
  }
};

const getUserClaims = async (req, res) => {
  const claimsCollection = client.db('assuredLife').collection('claims');
  const userId = req.user.uid; // Get user ID from authenticated user (Firebase UID)

  try {
    const claims = await claimsCollection.aggregate([
      {
        $match: { userId: userId } // Match userId as string
      },
      {
        $lookup: {
          from: 'policies',
          localField: 'policyId',
          foreignField: '_id',
          as: 'policyDetails'
        }
      },
      {
        $unwind: '$policyDetails'
      },
      {
        $project: {
          _id: 1,
          reason: 1,
          documents: 1,
          status: 1,
          submittedAt: 1,
          policyName: '$policyDetails.title',
          policyAmount: '$policyDetails.coverageRange.max', // Assuming max coverage is the amount
        }
      },
      {
        $sort: { submittedAt: -1 }
      }
    ]).toArray();

    res.status(200).json(claims);
  } catch (error) {
    console.error('Error fetching user claims:', error);
    res.status(500).json({ message: 'Server error fetching user claims.' });
  }
};

const updateClaimStatus = async (req, res) => {
  const claimsCollection = client.db('assuredLife').collection('claims');
  const applicationsCollection = client.db('assuredLife').collection('applications');
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await claimsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    // Find the claim to get its applicationId
    const updatedClaim = await claimsCollection.findOne({ _id: new ObjectId(id) });

    if (updatedClaim && updatedClaim.applicationId) {
      // Update the claimStatus in the corresponding application
      await applicationsCollection.updateOne(
        { _id: updatedClaim.applicationId },
        { $set: { claimStatus: status } }
      );
    }

    res.status(200).json({ message: 'Claim status updated successfully.' });
  } catch (error) {
    console.error('Error updating claim status:', error);
    res.status(500).json({ message: 'Server error updating claim status.' });
  }
};

module.exports = { submitClaim, getAllClaims, getUserClaims, updateClaimStatus };
