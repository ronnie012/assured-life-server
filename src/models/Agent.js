const { ObjectId } = require('mongodb');

class Agent {
  constructor(userId, name, photo, experience, specialties) {
    this.userId = new ObjectId(userId);
    this.name = name;
    this.photo = photo;
    this.experience = experience;
    this.specialties = specialties;
    this.status = 'pending'; // Default status
    this.createdAt = new Date();
  }
}

module.exports = Agent;