const { ObjectId } = require('mongodb');

class User {
  constructor(email, password, role = 'customer', name = null, photoURL = null, lastLogin = null) {
    this.email = email;
    this.password = password; // In a real app, this would be hashed
    this.role = role;
    this.name = name;
    this.photoURL = photoURL;
    this.lastLogin = lastLogin;
  }

  static collectionName() {
    return 'users';
  }

  // You might add static methods here for common DB operations if not using a separate service layer
  // e.g., static async findByEmail(db, email) { ... }
}

module.exports = User;
