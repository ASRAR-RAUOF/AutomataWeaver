const express = require('express');
const router = express.Router();
const { isLoggedIn,isUser,asyncWrap } = require('../middleware');
const automataController =require("../controllers/automata");


router.route('/')
  // Create a new automaton
  .post(isLoggedIn,asyncWrap(automataController.createAutomata))
  // Get all automatons
  .get( isLoggedIn,isUser,asyncWrap(automataController.getallAutomatas))
  //Delete all automatons
  .delete(isLoggedIn,isUser, asyncWrap(automataController.deleteallAutomatas));

router.route('/:id')
  // Get automaton by ID
  .get(isLoggedIn,isUser, asyncWrap(automataController.getAutomatabyid))
  // Update an automaton
  .put(isLoggedIn,isUser, asyncWrap(automataController.updateAutoamata))
  // Delete an automaton
  .delete(isLoggedIn,isUser, asyncWrap(automataController.deleteAutomata));

    
       
module.exports = router;
