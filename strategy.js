const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User.js');

const customFields = {
  usernameField: 'usernameOrEmail',
  passwordField: 'password'
};

const verifyFunction = async (usernameOrEmail, password, done) => {
  try {
    const user = await User.findByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      return done(null, false, { message: 'Incorrect username/email or password.' });
    }
    
    // Use the authenticate method provided by passport-local-mongoose
    user.authenticate(password, (err, authenticatedUser, passwordErr) => {
      if (err) {
        return done(err);
      }
      if (passwordErr) {
        return done(null, false, { message: 'Incorrect username/email or password.' });
      }
      return done(null, authenticatedUser);
    });
  } catch (err) {
    return done(err);
  }
};

const strategy = new LocalStrategy(customFields, verifyFunction);

module.exports = strategy;