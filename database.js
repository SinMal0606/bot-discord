const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'game.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      userId TEXT PRIMARY KEY,
      gold INTEGER DEFAULT 0
    )
  `);
});

// Hàm lấy vàng
function getPlayerGold(userId) {
  return new Promise((resolve) => {
    db.get(`SELECT gold FROM players WHERE userId = ?`, [userId], (err, row) => {
      if (err || !row) resolve(0);
      else resolve(row.gold || 0);
    });
  });
}

// Hàm cộng tích lũy vàng (Đã tối ưu SQL)
function addPlayerGold(userId, amount) {
  return new Promise((resolve) => {
    if (!amount || amount <= 0) return resolve();

    // Lấy vàng hiện tại rồi cộng thêm vào
    db.get(`SELECT gold FROM players WHERE userId = ?`, [userId], (err, row) => {
      const currentGold = (row && row.gold) ? row.gold : 0;
      const newTotal = currentGold + amount;

      db.run(
        `INSERT OR REPLACE INTO players (userId, gold) VALUES (?, ?)`,
        [userId, newTotal],
        (err) => {
          if (err) console.error("❌ Lỗi lưu vàng vào DB:", err.message);
          else console.log(`💰 Đã cộng ${amount} vàng cho ${userId}. Tổng mới: ${newTotal}`);
          resolve();
        }
      );
    });
  });
}

module.exports = {
  getPlayerGold,
  addPlayerGold
};