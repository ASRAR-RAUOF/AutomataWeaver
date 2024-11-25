
const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");
const Automaton = require('./Automaton');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // This allows null values and only enforces uniqueness for non-null values
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.plugin(passportLocalMongoose, {
  usernameField: 'username', // Use 'username' as the main field for authentication
  usernameLowerCase: true, // Ensure usernames are case-insensitive
});

// Add a static method to find a user by username or email
UserSchema.statics.findByUsernameOrEmail = function(usernameOrEmail) {
  return this.findOne({
    $or: [
      { username: usernameOrEmail.toLowerCase() },
      { email: usernameOrEmail.toLowerCase() }
    ]
  });
};

// Post middleware: After a user is deleted, delete all related automata
UserSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    // Delete all automata associated with the deleted user
    await Automaton.deleteMany({ user: doc._id });
    console.log(`Deleted all automata for user: ${doc._id}`);
  }
});

module.exports = mongoose.model('User', UserSchema);