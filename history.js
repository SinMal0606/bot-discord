const db = require('./database');

// Hàm lưu lịch sử khi kết thúc Run
function saveRunHistory(run) {
    const buildName = `${run.main_race} (${run.sub_race}) - Vũ khí: ${run.weapon || 'Tay Không'}`;
    
    // 1. Thêm bản ghi mới
    db.prepare(`
        INSERT INTO run_history (user_id, build_name, max_floor, final_str, final_dex, final_int, final_vit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(run.user_id, buildName, run.floor, run.str, run.dex, run.int, run.vit);

    // 2. Chỉ giữ lại 5 build mới nhất, xóa các build cũ hơn
    db.prepare(`
        DELETE FROM run_history 
        WHERE user_id = ? AND id NOT IN (
            SELECT id FROM run_history 
            WHERE user_id = ? 
            ORDER BY id DESC LIMIT 5
        )
    `).run(run.user_id, run.user_id);
}

// Hàm lấy 5 build gần nhất
function getTop5History(userId) {
    return db.prepare(`
        SELECT * FROM run_history 
        WHERE user_id = ? 
        ORDER BY id DESC LIMIT 5
    `).all(userId);
}

module.exports = { saveRunHistory, getTop5History };