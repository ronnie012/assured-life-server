const { ObjectId } = require('mongodb');

class Blog {
  constructor(title, content, author, publishDate = new Date()) {
    this.title = title;
    this.content = content;
    this.author = author;
    this.publishDate = publishDate;
  }

  static collectionName() {
    return 'blogs';
  }
}

module.exports = Blog;
