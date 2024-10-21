
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require("express-session");
const MongoStore =require('connect-mongo');
const flash = require("connect-flash");
const path = require("path");
const fs = require('fs');
const { execSync } = require('child_process');
const cors = require('cors');

const automatonRoutes = require('./routes/automatonroutes.js');
const userRoutes = require("./routes/userroutes.js");
const customStrategy = require('./strategy');
const User = require('./models/User.js');


const app = express();
const frontendUrl = process.env.FRONTEND_URL;

app.use(cors({ 
  origin: frontendUrl, 
  credentials: true 
}));

app.use(express.urlencoded({ extended: true }));
app.set("view engine", 'ejs');
app.set("views", path.join(__dirname, "views"));

// Path to the .env file
const envFilePath = path.join(__dirname, '.env');

// Function to reload the .env file after generating secrets
const reloadEnv = () => {
    for (const key in process.env) {
        if (key.startsWith('SECRET') || key.startsWith('JWT_SECRET')) {
            delete process.env[key];
        }
    }
    require('dotenv').config(); // Re-load the .env file
};

// Check if .env file exists or if necessary environment variables are missing
if (!fs.existsSync(envFilePath) || !process.env.JWT_SECRET || !process.env.SECRET) {
    console.log('Generating missing secrets...');
    execSync('node generateEnv.js', { stdio: 'inherit' });
    reloadEnv();
}
// MongoDB connection
const db_url=process.env.ATLASDB_URL;
async function main() {
    await mongoose.connect(db_url);
    console.log("connected to DB");
}
main().catch(err => console.log(err));

const store = MongoStore.create({
  mongoUrl:db_url,
  crypto:{
   secret:process.env.SECRET,
  },
  touchAfter:43200, //12 hours 
 
 });
 
  store.on("error",()=>
  {
     console.log("ERROR IN MONGO SESSION STORE",err);
  });

// Session options
const sessionOptions = {
    store:store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax' // Required for cross-site cookies in production
    }
};



app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(customStrategy);

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async function(accessToken, refreshToken, profile, done) {
  try {
      const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
      if (!email) {
          return done(new Error('No email found in Google profile'));
      }

      let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: email }] });
      
      if (!user) {
          user = new User({
              username: profile.displayName,
              googleId: profile.id,
              email: email 
          });
          await user.save();
      } else if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
      }

      return done(null, user);
  } catch (err) {
      return done(err);
  }
}));
// Passport configuration
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => done(null, user))
    .catch(err => done(err, null));
});

// Add flash messages and user to local variables
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api', userRoutes);
app.use('/api/automatons', automatonRoutes);

// Test root route
app.get("/", (req, res) => {
    res.send("Welcome to the AutomataWeaver  backend API");
});



// Error-handling middleware 
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
        error: process.env.NODE_ENV === "production" ? {} : err.message
    });
});

// Server listening
const port = process.env.PORT || 3000; // Use environment port or default to 3000
app.listen(port, () => {
    console.log(`server is listening to port ${port}`);
});
