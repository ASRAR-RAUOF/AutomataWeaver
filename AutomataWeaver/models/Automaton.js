const mongoose = require('mongoose');

const ControlPointSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  flag: { type: Boolean, required: true },
  text: { type: String, default: '' },
  id: { type: Number, required: true }
}, { _id: false });

const TransitionSchema = new mongoose.Schema({
  text: [{ type: String }],
  id1: { type: Number, required: true },
  id2: { type: Number, required: true }
}, { _id: false });

const AutomatonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: false, enum: ['DFA', 'NFA', 'PDA', 'TM'] },
  controlPoints: [ControlPointSchema],
  transitions: [TransitionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { discriminatorKey: 'type' });

const Automaton = mongoose.model('Automaton', AutomatonSchema);
module.exports = Automaton;