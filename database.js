const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'game.db');
const db = new Database(dbPath);

// Tự động bật WAL mode để tối ưu hiệu năng
db.pragma('journal_mode = WAL');

// Khởi tạo bảng
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    userId TEXT PRIMARY KEY,
    gold INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS builds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    raceName TEXT,
    weaponName TEXT,
    roomReached INTEGER
  );
`);

function getPlayerGold(userId) {
  const row = db.prepare(`SELECT gold FROM players WHERE userId = ?`).get(userId);
  return row ? row.gold : 0;
}

function addPlayerGold(userId, amount) {
  if (!amount || amount <= 0) return;
  const currentGold = getPlayerGold(userId);
  const newTotal = currentGold + amount;
  
  db.prepare(`INSERT OR REPLACE INTO players (userId, gold) VALUES (?, ?)`).run(userId, newTotal);
}

module.exports = {
  getPlayerGold,
  addPlayerGold
};