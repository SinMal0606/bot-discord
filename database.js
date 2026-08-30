const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  gold: { type: Number, default: 0 },
  savedBuilds: [mongoose.Schema.Types.Mixed],
  currentRun: { type: mongoose.Schema.Types.Mixed, default: null }
});

const User = mongoose.model('User', UserSchema);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

module.exports = { connectDB, User };