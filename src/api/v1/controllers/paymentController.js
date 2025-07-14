const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const applicationsCollection = client.db('life-insurance').collection('applications');
const policiesCollection = client.db('life-insurance').collection('policies');
const transactionsCollection = client.db('assuredLife').collection('transactions');

const createPaymentIntent = async (req, res) => {
  const { amount, policyId, applicationId } = req.body; // amount in cents
  const userId = req.user.uid; // From authenticated user (Firebase UID)

  try {
    // Optional: Verify policy and application exist and belong to the user
    const application = await applicationsCollection.findOne({ _id: new ObjectId(applicationId), userId: new ObjectId(userId) });
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
  const { transactionId, amount, currency, status, paymentMethod, policyId, applicationId } = req.body;
    const userId = req.user.uid;

  try {
    const newTransaction = {
      userId: new ObjectId(userId),
      policyId: new ObjectId(policyId),
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
