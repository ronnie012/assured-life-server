const { ObjectId } = require('mongodb');

class Transaction {
  constructor(userId, policyId, transactionId, amount, currency, status, paymentMethod, createdAt = new Date()) {
    this.userId = userId;
    this.policyId = policyId;
    this.transactionId = transactionId;
    this.amount = amount;
    this.currency = currency;
    this.status = status; // e.g., 'success', 'failed', 'pending'
    this.paymentMethod = paymentMethod; // e.g., 'Stripe'
    this.createdAt = createdAt;
  }

  static collectionName() {
    return 'transactions';
  }
}

module.exports = Transaction;
