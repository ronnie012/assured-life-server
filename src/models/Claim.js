const { ObjectId } = require('mongodb');

class Claim {
  constructor(userId, policyId, reason, documents = [], status = 'Pending', submittedAt = new Date()) {
    this.userId = userId;
    this.policyId = policyId;
    this.reason = reason;
    this.documents = documents; // Array of document URLs/paths
    this.status = status; // e.g., 'Pending', 'Approved', 'Rejected'
    this.submittedAt = submittedAt;
  }

  static collectionName() {
    return 'claims';
  }
}

module.exports = Claim;
