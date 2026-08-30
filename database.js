const mongoose = require('mongoose');

// Kết nối tới MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB Atlas thành công!'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// Định nghĩa Schema người chơi
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  gold: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Các hàm tương tác
async function addPlayerGold(userId, amount) {
  try {
    if (!amount || amount <= 0) return;

    // Ép kiểu userId về String để tránh lệch Schema
    const idStr = String(userId);

    // Dùng findOneAndUpdate với $inc để cộng dồn
    const updatedUser = await User.findOneAndUpdate(
      { userId: idStr },
      { $inc: { gold: amount } },
      { new: true, upsert: true } // Nếu chưa có record thì tự tạo mới
    );

    console.log(`✅ [DB] Đã cộng ${amount} gold cho ID ${idStr}. Tổng hiện tại: ${updatedUser.gold}`);
    return updatedUser;
  } catch (error) {
    console.error('❌ [DB Error] Lỗi khi addPlayerGold:', error);
  }
}

async function getPlayerGold(userId) {
  try {
    const idStr = String(userId);
    const user = await User.findOne({ userId: idStr });
    
    return user ? user.gold : 0;
  } catch (error) {
    console.error('❌ [DB Error] Lỗi khi getPlayerGold:', error);
    return 0;
  }
}

module.exports = { getPlayerGold, addPlayerGold };