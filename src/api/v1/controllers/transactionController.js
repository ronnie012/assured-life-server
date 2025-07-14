const { ObjectId } = require('mongodb');
const client = require('../../../config/db');

const transactionsCollection = client.db('assuredLife').collection('transactions');

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await transactionsCollection.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $lookup: {
          from: 'policies',
          localField: 'policyId',
          foreignField: '_id',
          as: 'policyInfo'
        }
      },
      {
        $unwind: '$policyInfo'
      },
      {
        $project: {
          _id: 1,
          transactionId: 1,
          amount: 1,
          currency: 1,
          status: 1,
          paymentMethod: 1,
          createdAt: 1,
          'userEmail': '$userInfo.email',
          'policyName': '$policyInfo.title',
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ message: 'Server error fetching transactions.' });
  }
};

const getUserTransactions = async (req, res) => {
  const userId = req.user.uid; // Get user ID from authenticated user (Firebase UID)

  try {
    const transactions = await transactionsCollection.aggregate([
      {
        $match: { userId: new ObjectId(userId) }
      },
      {
        $lookup: {
          from: 'policies',
          localField: 'policyId',
          foreignField: '_id',
          as: 'policyInfo'
        }
      },
      {
        $unwind: '$policyInfo'
      },
      {
        $project: {
          _id: 1,
          transactionId: 1,
          amount: 1,
          currency: 1,
          status: 1,
          paymentMethod: 1,
          createdAt: 1,
          'policyName': '$policyInfo.title',
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ message: 'Server error fetching user transactions.' });
  }
};

module.exports = { getAllTransactions, getUserTransactions };