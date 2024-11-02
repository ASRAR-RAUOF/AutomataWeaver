
const Automaton = require("./models/Automaton");
 
module.exports = {
    
     asyncWrap:(fn) => {
        return function(req, res, next) {
            return Promise.resolve(fn(req, res, next)).catch(next);
        };
    },
   
     isLoggedIn:(req, res, next) => {
        if (!req.isAuthenticated()) {
            req.session.redirectUrl=req.originalUrl;
            return res.status(401).json({
                success: false,
                message: "Already logged out",
            });
        }
        next();
    },
    saveRedirectUrl:(req,res,next)=>
    {
        if(req.session.redirectUrl)
        {
            res.locals.redirectUrl=req.session.redirectUrl;
        }
        next(); 
    },
   
    isUser:async(req, res, next) => {
        try {
            // Find the automaton
            const automaton = await Automaton.findById(req.params.id);
            
            // Check if automaton exists
            if (!automaton) {
                return res.status(404).json({ error: 'Automaton not found' });
            }

            // Compare the automaton's user ID with current user's ID
            if (automaton.user.toString() !== res.locals.currUser._id.toString()) {
                return res.status(403).json({ error: 'Not authorized to access this automaton' });
            }

            // Store automaton in request for potential future use
            req.automaton = automaton;
            next();
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },
   




};
