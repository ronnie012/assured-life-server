const { ObjectId } = require('mongodb');
const { client } = require('../../../config/db');

const getAllTransactions = async (req, res) => {
  const transactionsCollection = client.db('assuredLifeDbUpgraded').collection('transactions');
  try {
    const transactions = await transactionsCollection.aggregate([
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
        $lookup: {
          from: 'policies',
          localField: 'policyId',
          foreignField: '_id',
          as: 'policyInfo'
        }
      },
      {
        $unwind: { path: '$policyInfo', preserveNullAndEmptyArrays: true }
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
  const transactionsCollection = client.db('assuredLifeDbUpgraded').collection('transactions');
  const userId = req.user.uid; // Get user ID from authenticated user (Firebase UID)

  try {
    const transactions = await transactionsCollection.aggregate([
      {
        $match: { userId: userId }
      },
      {
        $addFields: {
          policyObjectId: { $toObjectId: "$policyId" }
        }
      },
      {
        $lookup: {
          from: 'policies',
          localField: 'policyObjectId',
          foreignField: '_id',
          as: 'policyInfo'
        }
      },
      {
        $unwind: { path: '$policyInfo', preserveNullAndEmptyArrays: true }
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
    console.log('Backend: User transactions fetched:', JSON.stringify(transactions, null, 2));

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ message: 'Server error fetching user transactions.' });
  }
};

const createTransaction = async (req, res) => {
  // Placeholder for creating a transaction
  res.status(201).json({ message: 'Transaction creation not yet implemented.' });
};

const updateTransaction = async (req, res) => {
  // Placeholder for updating a transaction
  res.status(200).json({ message: 'Transaction update not yet implemented.' });
};

const deleteTransaction = async (req, res) => {
  // Placeholder for deleting a transaction
  res.status(200).json({ message: 'Transaction deletion not yet implemented.' });
};

module.exports = { getAllTransactions, getUserTransactions, createTransaction, updateTransaction, deleteTransaction };