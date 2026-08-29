// Scaling factor: S = 1.5, A = 1.2, B = 1.0, C = 0.8, D = 0.5
module.exports = [
  { id: "w1", name: "Tập Cổ Kiếm", baseAtk: 12, type: "physical", scaling: { str: 1.0 }, desc: "Vũ khí khởi đầu STR" },
  { id: "w2", name: "Dao Găm Săn Thú", baseAtk: 10, type: "physical", scaling: { dex: 1.0 }, desc: "Vũ khí khởi đầu DEX" },
  { id: "w3", name: "Gậy Gỗ Phép", baseAtk: 10, type: "magic", scaling: { int: 1.0 }, desc: "Vũ khí khởi đầu INT" },
  { id: "w4", name: "Búa Cầu Nguyện", baseAtk: 11, type: "holy", scaling: { faith: 1.0 }, desc: "Vũ khí khởi đầu FAITH" },
  { id: "w5", name: "Đại Kiếm Rồng", baseAtk: 24, type: "physical", scaling: { str: 1.4, vigor: 0.5 } },
  { id: "w6", name: "Cung Bão Tố", baseAtk: 20, type: "lightning", scaling: { dex: 1.5 } },
  { id: "w7", name: "Quyền Lực Trượng", baseAtk: 22, type: "fire", scaling: { int: 1.3, mind: 0.7 } },
  { id: "w8", name: "Thánh Kiếm Phạt Tội", baseAtk: 23, type: "holy", scaling: { faith: 1.4, str: 0.6 } }
];