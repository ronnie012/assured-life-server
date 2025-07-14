const { ObjectId } = require('mongodb');

class Policy {
  constructor(title, category, description, minAge, maxAge, coverageRange, durationOptions, basePremiumRate, policyImage, purchaseCount = 0) {
    this.title = title;
    this.category = category;
    this.description = description;
    this.minAge = minAge;
    this.maxAge = maxAge;
    this.coverageRange = coverageRange;
    this.durationOptions = durationOptions;
    this.basePremiumRate = basePremiumRate;
    this.policyImage = policyImage;
    this.purchaseCount = purchaseCount; // To track popularity
  }

  static collectionName() {
    return 'policies';
  }
}

module.exports = Policy;
