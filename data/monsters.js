module.exports = {
  normalMonsters: [
    // --- PHÒNG 1 - 5 ---
    {
      minRoom: 1,
      maxRoom: 5,
      name: "Goblin Trinh Sát",
      hp: 35,
      skills: [
        { name: "Đâm Dao", multiplier: 1.0, type: "physical" },
        { name: "Ném Bốc Lửa", multiplier: 1.2, type: "fire" }
      ],
      // Nhạy cảm với Lửa (-20%), kháng Nhẹ Vật lý (10%)
      resistances: { physical: 0.10, magic: 0.0, fire: -0.20, lightning: 0.0, holy: 0.0 }
    },
    {
      minRoom: 1,
      maxRoom: 5,
      name: "Sói Rừng Hung Tợn",
      hp: 45,
      skills: [
        { name: "Vồ Cắn", multiplier: 1.1, type: "physical" }
      ],
      // Kháng Sét nhẹ, sợ Phép & Thần thánh
      resistances: { physical: 0.0, magic: -0.15, fire: 0.0, lightning: 0.15, holy: -0.15 }
    },

    // --- PHÒNG 6 - 10 ---
    {
      minRoom: 6,
      maxRoom: 10,
      name: "Bóng Ma Cổ Đại",
      hp: 75,
      skills: [
        { name: "Cào Cấu", multiplier: 0.8, type: "physical" },
        { name: "Sóng Âm Ma Quái", multiplier: 1.4, type: "magic" },
        { name: "Tia Sét Nguyền Rủa", multiplier: 1.6, type: "lightning" }
      ],
      // Kháng cao Vật lý (60%), nhưng cực kỳ sợ Phép Thần Thánh (-50%)
      resistances: { physical: 0.60, magic: 0.10, fire: 0.0, lightning: 0.20, holy: -0.50 }
    },

    // --- PHÒNG 11 - 14 ---
    {
      minRoom: 11,
      maxRoom: 14,
      name: "Quỷ Lửa Địa Ngục",
      hp: 120,
      skills: [
        { name: "Cú Đấm Dung Nham", multiplier: 1.3, type: "fire" },
        { name: "Thiêu Rụi", multiplier: 1.8, type: "fire" }
      ],
      // Kháng Lửa gần như tuyệt đối (80%), nhưng yếu trước Phép Thuật (-30%)
      resistances: { physical: 0.20, magic: -0.30, fire: 0.80, lightning: 0.10, holy: -0.10 }
    }
  ],

  // --- BOSS PHÒNG 15 ---
  bosses: {
    10: {
      name: "Thủ Lĩnh Trinh Sát: Sable Eye",
      hp: 200,
      skills: [
        { name: "Chém Cuồng Nộ", multiplier: 1.0, type: "physical" },
        { name: "Bão Lửa Địa Ngục", multiplier: 1.3, type: "fire" },
        { name: "Tia Sáng Trừng Phạt", multiplier: 1.5, type: "holy" }
      ],
      resistances: { physical: 0.2, magic: 0.1, fire: 0.3, lightning: 0.2, holy: 0.2 }
    },20: {
      name: "Tướng Lĩnh Quân Đoàn: Varkor",
      hp: 300,
      skills: [
        { name: "Chém Cuồng Nộ", multiplier: 1.3, type: "physical" },
        { name: "Bão Lửa Địa Ngục", multiplier: 1.5, type: "fire" },
        { name: "Tia Sáng Trừng Phạt", multiplier: 1.8, type: "holy" }
      ],
      resistances: { physical: 0.30, magic: 0.1, fire: 0.30, lightning: 0.1, holy: 0.1 }
    },
    30: {
      name: "👑 Chúa Tể Hắc An: Malakor",
      hp: 400,
      skills: [
        { name: "Chém Cuồng Nộ", multiplier: 1.2, type: "physical" },
        { name: "Bão Lửa Địa Ngục", multiplier: 1.8, type: "fire" },
        { name: "Tia Sáng Trừng Phạt", multiplier: 2.2, type: "holy" }
      ],
      resistances: { physical: 0.30, magic: 0.30, fire: 0.30, lightning: 0.30, holy: -0.20 }
    }
  }
};