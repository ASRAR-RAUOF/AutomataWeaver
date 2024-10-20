
const Automaton = require("./models/Automaton");
 
module.exports = {
    asyncWrap: (fn) => {
        return function (req, res, next) {
            fn(req, res, next).catch((err) => next(err));
        };
    },
    isLoggedIn: (req, res, next) => {
        if (!req.isAuthenticated()) {
            req.session.redirectUrl=req.originalUrl;
            req.flash("error", "You must be logged in to save automaton");
            return res.redirect("/login");
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
    isUser:async(req,res,next)=>
    {
        let {id}=req.params;
        let automaton = await Automaton.findById(id);
        if(!automaton.user.equals(res.locals.currUser._id))
        {
            return  res.redirect("/api.login");
            //change  
        }

        next();

    },
       
    
};