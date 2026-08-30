const mongoose = require('mongoose');

// 1. Kết nối MongoDB
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB kết nối thành công!'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));
} else {
  console.error('⚠️ CẢNH BÁO: Chưa cấu hình MONGODB_URI trong biến môi trường!');
}

// 2. Khai báo Schema (Ép kiểu userId thành String)
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  gold: { type: Number, default: 0 }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// 3. Hàm cộng vàng vào DB (có Log chi tiết)
async function addPlayerGold(userId, amount) {
  try {
    const idStr = String(userId);
    const goldToAdd = Number(amount) || 0;

    if (goldToAdd <= 0) return 0;

    const updatedUser = await User.findOneAndUpdate(
      { userId: idStr },
      { $inc: { gold: goldToAdd } },
      { new: true, upsert: true }
    );

    console.log(`💰 [DB LOG] Đã cộng ${goldToAdd} gold cho ID ${idStr}. Tổng hiện tại: ${updatedUser.gold}`);
    return updatedUser.gold;
  } catch (error) {
    console.error('❌ [DB ERROR] Lỗi addPlayerGold:', error);
    return 0;
  }
}

// 4. Hàm lấy số vàng
async function getPlayerGold(userId) {
  try {
    const idStr = String(userId);
    const user = await User.findOne({ userId: idStr });
    return user ? user.gold : 0;
  } catch (error) {
    console.error('❌ [DB ERROR] Lỗi getPlayerGold:', error);
    return 0;
  }
}

module.exports = {
  addPlayerGold,
  getPlayerGold
};