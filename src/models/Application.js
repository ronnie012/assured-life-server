const { ObjectId } = require('mongodb');

class Application {
  constructor(userId, policyId, personalData, nomineeData, healthDisclosure, status = 'Pending', submittedAt = new Date()) {
    this.userId = userId;
    this.policyId = policyId;
    this.personalData = personalData; // Object with name, email, address, NID/SSN, etc.
    this.nomineeData = nomineeData;   // Object with name, relationship, etc.
    this.healthDisclosure = healthDisclosure; // Array of selected health conditions/checkboxes
    this.status = status; // e.g., 'Pending', 'Approved', 'Rejected'
    this.submittedAt = submittedAt;
  }

  static collectionName() {
    return 'applications';
  }
}

module.exports = Application;
