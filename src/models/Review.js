const { ObjectId } = require('mongodb');

class Review {
  constructor(userId, userName, userImage, rating, message, policyId = null, agentId = null, createdAt = new Date()) {
    this.userId = userId; // Reference to the user who submitted the review
    this.userName = userName;
    this.userImage = userImage;
    this.rating = rating;
    this.message = message;
    this.policyId = policyId; // Optional: if review is for a policy
    this.agentId = agentId;   // Optional: if review is for an agent
    this.createdAt = createdAt;
  }

  static collectionName() {
    return 'reviews';
  }
}

module.exports = Review;
