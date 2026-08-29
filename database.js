const Datastore = require('nedb-promises');
const path = require('path');

// Khởi tạo các file lưu trữ dữ liệu
const db = {};
db.players = Datastore.create({ filename: path.join(__dirname, 'players.db'), autoload: true });
db.builds = Datastore.create({ filename: path.join(__dirname, 'builds.db'), autoload: true });

// Hàm lấy số vàng của người chơi
async function getPlayerGold(userId) {
  try {
    const doc = await db.players.findOne({ userId });
    return doc ? doc.gold || 0 : 0;
  } catch (err) {
    console.error("Lỗi lấy vàng:", err);
    return 0;
  }
}

// Hàm cộng tích lũy vàng
async function addPlayerGold(userId, amount) {
  if (!amount || amount <= 0) return;
  try {
    const currentGold = await getPlayerGold(userId);
    const newTotal = currentGold + amount;

    await db.players.update(
      { userId },
      { $set: { userId, gold: newTotal } },
      { upsert: true }
    );
    console.log(`💰 Đã cộng ${amount} vàng cho ${userId}. Tổng mới: ${newTotal}`);
  } catch (err) {
    console.error("Lỗi cộng vàng:", err);
  }
}

module.exports = {
  getPlayerGold,
  addPlayerGold
};