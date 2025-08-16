const { client } = require('../../../config/db');

const getAllFAQs = async (req, res) => {
  const faqsCollection = client.db('assuredLifeDbUpgraded').collection('faqs');
  try {
    const faqs = await faqsCollection.find({}).sort({ createdAt: 1 }).toArray();
    res.status(200).json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ message: 'Server error fetching FAQs.' });
  }
};

module.exports = { getAllFAQs };
