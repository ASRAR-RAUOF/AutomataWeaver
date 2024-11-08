
const User = require('../models/User.js');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

module.exports = {
    
    
    signup: async (req, res, next) => {
        try {
            let { username, email, password } = req.body;
    
            // Validate input
            if (!username || !email || !password) {
                return res.status(400).json({ success: false, message: "All fields are required" });
            }
    
            // Check if the user already exists
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) {
                if (existingUser.email === email) {
                    return res.status(400).json({ success: false, message: "An account with that email already exists. Please log in." });
                } else {
                    return res.status(400).json({ success: false, message: "That username is already taken. Please choose another." });
                }
                
            }
    
            // If no existing user, register a new one
            const newUser = new User({ username, email });
            const registeredUser = await User.register(newUser, password);
    
            // Log the user in automatically after registration
            req.login(registeredUser, (err) => {
                if (err) {
                    return next(err);
                }
                res.json({ success: true, message: "Welcome! You have successfully registered." });
            });
        } catch (e) {
            console.error("Signup error:", e);
            res.status(500).json({ success: false, message: e.message || "An error occurred during registration" });
        }
    },
    
    googleOAuthCallback: async (req, res) => {
        try {
            const { email, id: googleId, displayName: username } = req.user;
    
            // Check if the user already exists by email
            let user = await User.findOne({ email });
    
            if (user) {
                // If user exists but doesn't have googleId, link the Google account
                if (!user.googleId) {
                    user.googleId = googleId;
                    user.username = user.username || username; // Update username if it doesn't exist
                    await user.save();
                    return res.json({ success: true, message: 'Google account linked to your existing profile.' });
                } else {
                    return res.json({ success: true, message: 'Welcome back! Logged in with Google.' });
                }
            } else {
                // If no existing user, create a new user
                user = new User({ email, googleId, username });
                await user.save();
                 
            }
    
            // Log the user in
            req.login(user, (err) => {
                if (err) {
                    console.error("Login error: ", err);
                    return res.status(500).json({ success: false, message: 'An error occurred while logging in.' });
                }
                return res.json({ success: true, message: 'Logged in successfully.', user });
            });
        } catch (error) {
            console.error("Google OAuth error: ", error);
            return res.status(500).json({ success: false, message: 'An error occurred while logging in with Google.' });
        }
    },
    
    
   
    login:async (req, res) => {
        try {
          // If we reach here, authentication was successful
          const frontendUrl = process.env.FRONTEND_URL;
          const redirectUrl = res.locals.redirectUrl || `${frontendUrl}`;
          
          res.status(200).json({
            success: true,
            message: "Logged in successfully",
            redirectUrl: redirectUrl
          });
        } catch (error) {
          res.status(401).json({
            success: false,
            message: error.message || "Login failed"
          });
        }
      },

    

   
logout:(req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: "Error during logout" 
            });
        }
        
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destruction error", err);
                return res.status(500).json({ 
                    success: false, 
                    message: "Error destroying session" 
                });
            }
            
            res.clearCookie('connect.sid');
            res.status(200).json({ 
                success: true, 
                message: "You are logged out!" 
            });
        });
    });
},

    forgotPassword: async (req, res) => {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account with that email address exists.' });
        }
        // Check if user is authenticated through Google
        if (user.googleId ) {
            return res.status(400).json({
                success: false,
                message: 'This account uses Google Sign-In. Please reset your password through Google.'
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            secure: true,
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: true,  // Only use during development
                timeout: 30000, // 30 seconds timeout
                socketTimeout: 30000
            }
        });

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_ADDRESS,
            subject: 'AutomataWeaver Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                   Please click on the following link, or paste this into your browser to complete the process:\n\n
                   http://${req.headers.host}/api/reset-password/${token}\n
                   If you did not request this, please ignore this email and your password will remain unchanged.\n
                   This link will expire in 15 minutes`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Reset link sent to email address' });
    },


    renderResetPasswordForm: async (req, res) => {
        try {
            const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
    
            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL}?error=User not found`);
            }
    
            
            res.render('reset-password', { token: req.params.token });
            
        } catch (error) {
            res.redirect(`${process.env.FRONTEND_URL}?error=Invalid or expired token`);
        }
    },

    
    resetPassword: async (req, res) => {
        try {
            const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
             
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
             
            await user.setPassword(req.body.password);
            await user.save();
             
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'An error occurred while logging in.' });
                }
                 
                const redirectUrl = `${process.env.FRONTEND_URL}/automata-weaver`;
                
                req.flash('success', `Your password has been changed successfully. <a href="${redirectUrl}">Click here</a> to proceed.`);
                res.redirect('/redirect');
                

                
            });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Invalid or expired token. Please try again.' });
        }
    },

    deleteAccount: async (req, res, next) => {
        try {
            const userId = req.user._id;
            await User.findOneAndDelete({ _id: userId });
            req.logout((err) => {
                if (err) {
                    return next(err);
                }
                req.session.destroy((err) => {
                    if (err) {
                        console.error("Session destruction error", err);
                    }
                    res.clearCookie('connect.sid');
                    res.json({ success: true, message: 'Your account has been successfully deleted.' });
                });
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'An error occurred while deleting your account.' });
        }
    },
    // deleteAccount: async (req, res) => {
    //     try {
    //         const userId = req.user._id;
            
    //         // Delete user
    //         const deletedUser = await User.findByIdAndDelete(userId);
            
    //         if (!deletedUser) {
    //             return res.status(404).json({
    //                 success: false,
    //                 message: 'User not found.'
    //             });
    //         }
    
    //         // Logout user and clean up session
    //         req.logout((err) => {
    //             if (err) {
    //                 console.error("Logout error:", err);
    //                 return res.status(500).json({
    //                     success: false,
    //                     message: 'Error during logout process.'
    //                 });
    //             }
    
    //             req.session.destroy((err) => {
    //                 if (err) {
    //                     console.error("Session destruction error:", err);
    //                     return res.status(500).json({
    //                         success: false,
    //                         message: 'Error destroying session.'
    //                     });
    //                 }
    
    //                 res.clearCookie('connect.sid', {
    //                     path: '/',
    //                     httpOnly: true,
    //                     secure: process.env.NODE_ENV === 'production',
    //                     sameSite: 'lax'
    //                 });
    
    //                 res.status(200).json({
    //                     success: true,
    //                     message: 'Your account has been successfully deleted.'
    //                 });
    //             });
    //         });
    //     } catch (error) {
    //         console.error("Delete account error:", error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'An error occurred while deleting your account.'
    //         });
    //     }
    // },

    updatePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.user._id);
            
            // Use the changePassword method provided by passport-local-mongoose
            await user.changePassword(currentPassword, newPassword);
            
            await user.save();
            
            res.json({ success: true, message: 'Your password has been updated successfully.' });
        } catch (error) {
            console.error('Password update error:', error);
            res.status(400).json({ success: false, message: 'Failed to update password. Please ensure your current password is correct.' });
        }
    },
    
   
    updateUsername :async (req, res) => {
        try {
            const { username } = req.body; // Match the frontend property name
            
            if (!username || username.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Username cannot be empty'
                });
            }
    
            // Check if username already exists
            const existingUser = await User.findOne({ 
                username: username,
                _id: { $ne: req.user._id } // Exclude current user from check
            });
    
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
    
            // Update username
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { $set: { username: username } },
                { new: true, runValidators: true }
            );
    
            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
    
            res.status(200).json({
                success: true,
                message: 'Username updated successfully',
                username: updatedUser.username
            });
    
        } catch (error) {
            console.error('Update username error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update username'
            });
        }
    }
};