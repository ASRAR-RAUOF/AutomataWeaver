const express = require('express');
const router = express.Router();
const { isLoggedIn,isUser,asyncWrap } = require('../middleware');
const automataController =require("../controllers/automata");


router.route('/')
  // Create a new automaton
  .post(isLoggedIn,asyncWrap(automataController.createAutomata))
  // Get all automatons
  .get(isLoggedIn, asyncWrap(automataController.getallAutomatas))
  //Delete all automatons
  .delete(isLoggedIn,asyncWrap(automataController.deleteallAutomatas));

router.route('/:id')
  // Get automaton by ID
  .get(isLoggedIn,isUser, asyncWrap(automataController.getAutomataById))
  // Update an automaton
  .put(isLoggedIn,isUser, asyncWrap(automataController.updateAutomata))
  // Delete an automaton
  .delete( isLoggedIn,isUser,asyncWrap(automataController.deleteAutomata));
  //update name of file
  router.put('/:id/name', isLoggedIn, isUser, asyncWrap(automataController.updateAutomatonName));

    
       
module.exports = router;
