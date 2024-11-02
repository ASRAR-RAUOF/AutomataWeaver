const express = require('express');
const router = express.Router();
const passport=require("passport");
const { saveRedirectUrl,isLoggedIn,asyncWrap} = require('../middleware');
const userController=require("../controllers/user");

//route for login status
router.get('/login-status', isLoggedIn, (req, res) => {
  res.json({ isLoggedIn: true });
});
//signup
router.route('/signup')
.post(asyncWrap(userController.signup));



//login
router.route('/login').post(
  saveRedirectUrl,
  (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: info.message || "Invalid credentials"
        });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Login failed"
          });
        }
        
        // Proceed to login controller
        next();
      });
    })(req, res, next);
  },
  userController.login
);

 // Google Auth
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}`, failureFlash: true }),
      asyncWrap(userController.googleOAuthCallback)
  
  );

//logout
router.get("/logout",isLoggedIn,userController.logout); 


// Forgot Password
router.post('/forgot-password', asyncWrap(userController.forgotPassword));

// Reset Password
router.get('/reset-password/:token', asyncWrap(userController.renderResetPasswordForm));
router.post('/reset-password/:token', asyncWrap(userController.resetPassword));

//router.delete('/delete-account',isLoggedIn,asyncWrap(userController.deleteAccount));
router.delete('/delete-account', isLoggedIn, asyncWrap( userController.deleteAccount));
router.put('/update-password',  isLoggedIn,asyncWrap(userController.updatePassword));
router.put('/update-username', isLoggedIn,asyncWrap(userController.updateUsername));


module.exports=router;