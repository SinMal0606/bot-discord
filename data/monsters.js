module.exports = [
  {
    id: "m1", name: "Goblin", minFloor: 1, maxFloor: 9, isBoss: false,
    baseStats: { hp: 40, atk: 8 },
    resists: { physical: 2, magic: 0, fire: -5, lightning: 0, holy: 0 },
    skills: [
      { name: "Chém Cào", damageType: "physical", multiplier: 1.0 },
      { name: "Ném Bom Lửa", damageType: "fire", multiplier: 1.2 }
    ]
  },
  {
    id: "mb1", name: "Hiệp Sĩ Bóng Đêm (Miniboss)", minFloor: 10, maxFloor: 20, isBoss: true,
    baseStats: { hp: 150, atk: 20 },
    resists: { physical: 15, magic: 10, fire: 10, lightning: 5, holy: -10 },
    skills: [
      { name: "Thảm Sát", damageType: "physical", multiplier: 1.3 },
      { name: "Lưỡi Hái Thần Thánh", damageType: "holy", multiplier: 1.5 }
    ]
  },
  {
    id: "boss1", name: "Chúa Tể Dungeon (Boss)", minFloor: 30, maxFloor: 30, isBoss: true,
    baseStats: { hp: 500, atk: 45 },
    resists: { physical: 25, magic: 25, fire: 20, lightning: 20, holy: 20 },
    skills: [
      { name: "Hủy Diệt Phép Thật", damageType: "magic", multiplier: 1.6 },
      { name: "Sấm Sét Hoàng Gia", damageType: "lightning", multiplier: 1.8 }
    ]
  }
];