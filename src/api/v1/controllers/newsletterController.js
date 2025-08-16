const { client } = require('../../../config/db');

const subscribeToNewsletter = async (req, res) => {
  const newsletterSubscribersCollection = client.db('assuredLifeDbUpgraded').collection('newsletterSubscribers');
  const { name, email } = req.body;

  try {
    // Check if already subscribed
    const existingSubscriber = await newsletterSubscribersCollection.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'You are already subscribed to our newsletter.' });
    }

    const newSubscriber = { name, email, subscribedAt: new Date() };
    await newsletterSubscribersCollection.insertOne(newSubscriber);

    res.status(201).json({ message: 'Successfully subscribed to the newsletter!' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ message: 'Server error during subscription.' });
  }
};

module.exports = { subscribeToNewsletter };
