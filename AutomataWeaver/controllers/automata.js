
const Automaton = require('../models/Automaton');

module.exports.createAutomata = async (req, res) => {
  // Check if request body includes required fields
  if (!req.body.name) {
    const error = new Error('Missing required fields in request body');
    error.status = 400;
    throw error;
  }


  // Automatically associate the logged-in user with the automaton
  const automatonData = {
    ...req.body, // Spread the rest of the automaton data from the request
    user: req.user._id // Associate the logged-in user
  };

  // // Create a new Automaton instance
   const automaton = new Automaton(automatonData);
  // Save the automaton to the database
  const savedAutomaton = await automaton.save();

  // Return the saved automaton
  res.json(savedAutomaton);
};

module.exports.getallAutomatas = async (req, res) => {
  // Populate user details
  const automata = await Automaton.find().populate('user');

  if (automata.length === 0) {
    const error = new Error('No automata found');
    error.status = 404;
    throw error;
  }

  res.json(automata);
};

module.exports.getAutomataById = async (req, res) => {
  const automatonId = req.params.id;

  // Find the automaton by ID
  const automaton = await Automaton.findById(automatonId).populate('user');

  if (!automaton) {
    const error = new Error('Automaton not found');
    error.status = 404;
    throw error;
  }

  res.json(automaton);
};

module.exports.updateAutomata = async (req, res) => {
  const automatonId = req.params.id;

  // Update the automaton with the request body (excluding user and type)
  const { user, type, ...updateData } = req.body;
  const updatedAutomaton = await Automaton.findByIdAndUpdate(
    automatonId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedAutomaton) {
    const error = new Error('Automaton not found');
    error.status = 404;
    throw error;
  }

  res.json(updatedAutomaton);
};

module.exports.deleteAutomata = async (req, res) => {
  const automatonId = req.params.id;
  const deletedAutomaton = await Automaton.findByIdAndDelete(automatonId);

  if (!deletedAutomaton) {
    const error = new Error('Automaton not found');
    error.status = 404;
    throw error;
  }

  res.json({ message: 'Automaton deleted successfully' });
};

module.exports.deleteAllAutomatas = async (req, res) => {
  await Automaton.deleteMany();
  res.json({ message: 'All automata deleted successfully' });
};