const mongoose = require('mongoose');

// Kết nối tới MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB Atlas thành công!'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// Định nghĩa Schema người chơi
const playerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  gold: { type: Number, default: 0 }
});

const Player = mongoose.model('Player', playerSchema);

// Các hàm tương tác
async function getPlayerGold(userId) {
  const player = await Player.findOne({ userId });
  return player ? player.gold : 0;
}

async function addPlayerGold(userId, amount) {
  if (!amount || amount <= 0) return;
  await Player.findOneAndUpdate(
    { userId },
    { $inc: { gold: amount } },
    { upsert: true, new: true }
  );
}

module.exports = { getPlayerGold, addPlayerGold };