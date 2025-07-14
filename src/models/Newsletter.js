const { ObjectId } = require('mongodb');

class Newsletter {
  constructor(name, email, subscribedAt = new Date()) {
    this.name = name;
    this.email = email;
    this.subscribedAt = subscribedAt;
  }

  static collectionName() {
    return 'newsletterSubscribers';
  }
}

module.exports = Newsletter;
