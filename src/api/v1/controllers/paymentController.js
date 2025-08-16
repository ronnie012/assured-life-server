const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { ObjectId } = require('mongodb');
const { client } = require('../../../config/db');

const createPaymentIntent = async (req, res) => {
  console.log('createPaymentIntent - Request Body:', req.body);
  console.log('createPaymentIntent - Authenticated User ID:', req.user.uid);
  const applicationsCollection = client.db('assuredLifeDbUpgraded').collection('applications');
  const policiesCollection = client.db('assuredLifeDbUpgraded').collection('policies');
  const { amount, policyId, applicationId } = req.body; // amount in cents
  const userId = req.user.uid; // From authenticated user (Firebase UID)

  try {
    // Optional: Verify policy and application exist and belong to the user
    const application = await applicationsCollection.findOne({ _id: new ObjectId(applicationId), userId: userId });
    if (!application) {
      return res.status(404).json({ message: 'Application not found or does not belong to you.' });
    }

    const policy = await policiesCollection.findOne({ _id: new ObjectId(policyId) });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: { userId, policyId, applicationId },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Server error creating payment intent.' });
  }
};

const savePaymentInfo = async (req, res) => {
  const applicationsCollection = client.db('assuredLifeDbUpgraded').collection('applications');
  const policiesCollection = client.db('assuredLifeDbUpgraded').collection('policies');
  const transactionsCollection = client.db('assuredLifeDbUpgraded').collection('transactions');
  const { transactionId, amount, currency, status, paymentMethod, applicationId } = req.body; // Removed policyId from destructuring
  console.log('Backend: savePaymentInfo - received applicationId:', applicationId);
  const userId = req.user.uid;

  try {
    // Fetch the application to get the correct policyId
    const application = await applicationsCollection.findOne({ _id: new ObjectId(applicationId) });
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    const policyId = application.policyId; // Get policyId from the application

    const newTransaction = {
      userId: userId,
      policyId: policyId, // Use the policyId from the application
      applicationId: new ObjectId(applicationId),
      transactionId,
      amount,
      currency,
      status,
      paymentMethod,
      createdAt: new Date(),
    };

    await transactionsCollection.insertOne(newTransaction);

    // Update application status to 'Approved' and increment policy purchase count
    if (status === 'succeeded') {
      await applicationsCollection.updateOne(
        { _id: new ObjectId(applicationId) },
        { $set: { status: 'Approved', paymentStatus: 'Paid', updatedAt: new Date() } }
      );
      await policiesCollection.updateOne(
        { _id: new ObjectId(policyId) },
        { $inc: { purchaseCount: 1 } }
      );
    }

    res.status(201).json({ message: 'Payment information saved and application updated.' });
  } catch (error) {
    console.error('Error saving payment info:', error);
    res.status(500).json({ message: 'Server error saving payment info.' });
  }
};

module.exports = { createPaymentIntent, savePaymentInfo };
