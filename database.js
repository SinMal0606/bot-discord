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

// Cập nhật hàm addPlayerGold trong database.js
async function addPlayerGold(userId, amount) {
  try {
    if (!amount || amount <= 0) return;

    // Giả sử Model người dùng của bạn tên là User (hoặc Player/UserSchema)
    // Dùng $inc để cộng dồn trực tiếp vào field gold trong MongoDB
    await User.findOneAndUpdate(
      { userId: userId },
      { $inc: { gold: amount } },
      { new: true, upsert: true } // Nếu chưa có user thì tự tạo mới
    );
    console.log(`✅ Đã cộng ${amount} gold cho user: ${userId}`);
  } catch (error) {
    console.error('❌ Lỗi khi cộng gold vào Database:', error);
  }
}

module.exports = { getPlayerGold, addPlayerGold };