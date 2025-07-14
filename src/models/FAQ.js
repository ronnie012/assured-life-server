const { ObjectId } = require('mongodb');

class FAQ {
  constructor(question, answer, helpfulCount = 0, createdAt = new Date()) {
    this.question = question;
    this.answer = answer;
    this.helpfulCount = helpfulCount;
    this.createdAt = createdAt;
  }

  static collectionName() {
    return 'faqs';
  }
}

module.exports = FAQ;
