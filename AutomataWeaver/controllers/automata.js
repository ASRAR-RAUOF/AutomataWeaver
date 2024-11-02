
const Automaton = require('../models/Automaton');

module.exports =
{
  createAutomata:async (req, res) => {
  // Check if request body includes required fields
  if (!req.body.name) {
    const error = new Error('Missing required fields in request body');
    error.status = 400;
    throw error;
  }


  // // Automatically associate the logged-in user with the automaton
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
},


getallAutomatas : async (req, res) => {
  console.log("Current user:", req.user); // Check if req.user is defined
  try {
      if (!req.user) {
          return res.status(401).json({ success: false, message: "User not authenticated" });
      }

      const automatas = await Automaton.find({ user: req.user._id }).populate('user');
      
      if (!automatas || automatas.length === 0) {
          return res.status(404).json({
              success: false,
              message: "No automatas found for this user"
          });
      }

      return res.status(200).json({
          success: true,
          message: "Automatas fetched successfully",
          data: {
              count: automatas.length,
              automatas: automatas
          }
      });
  } catch (error) {
      console.error("Error in getallAutomatas:", error);
      return res.status(500).json({
          success: false,
          message: "Error fetching automatas",
          error: error.message
      });
  }
},


getAutomataById : async (req, res) => {
  const automatonId = req.params.id;

  // Find the automaton by ID
  const automaton = await Automaton.findById(automatonId).populate('user');

  if (!automaton) {
    const error = new Error('Automaton not found');
    error.status = 404;
    throw error;
  }

  res.json(automaton);
},

updateAutomata : async (req, res) => {
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
},

deleteAutomata : async (req, res) => {
  const automatonId = req.params.id;
  const deletedAutomaton = await Automaton.findByIdAndDelete(automatonId);

  if (!deletedAutomaton) {
    const error = new Error('Automaton not found');
    error.status = 404;
    throw error;
  }

  res.json({ message: 'Automaton deleted successfully' });
},


deleteallAutomatas : async (req, res) => {
  
  try {
      
      // Find and delete all automatas belonging to the user
      const result = await Automaton.deleteMany({ user: req.user._id });

      // Check if any automatas were deleted
      if (result.deletedCount === 0) {
          return res.status(404).json({
              success: false,
              message: "No automatas found for this user to delete"
          });
      }

      return res.status(200).json({
          success: true,
          message: "All automatas deleted successfully",
          data: {
              deletedCount: result.deletedCount
          }
      });

  } catch (error) {
      console.error("Error in deleteAllAutomatas:", error);
      return res.status(500).json({
          success: false,
          message: "Error deleting automatas",
          error: error.message
      });
  }
},
updateAutomatonName :async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const updatedAutomaton = await Automaton.findByIdAndUpdate(
    id,
    { name },
    { new: true, runValidators: true }
  );

  if (!updatedAutomaton) {
    const error = new Error('Automaton not found');
    error.status = 404;
    throw error;
  }

  res.json(updatedAutomaton);
},
};