const express = require('express');
const router = express.Router();
const passport=require("passport");
const { saveRedirectUrl,isLoggedIn,isUser,asyncWrap} = require('../middleware');
const userController=require("../controllers/user");


//signup
router.route('/signup')
.post(asyncWrap(userController.signup));

//login
router.route('/login')
 .post(saveRedirectUrl,passport.authenticate("local",{failureRedirect :`${process.env.FRONTEND_URL}`,failureFlash:true}),userController.login );

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

router.delete('/delete-account',isLoggedIn,isUser,asyncWrap(userController.deleteAccount));
router.put('/update-password',  isLoggedIn,isUser,asyncWrap(userController.updatePassword));
router.put('/update-username', isLoggedIn,isUser,asyncWrap(userController.updateUsername));


module.exports=router;