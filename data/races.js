module.exports = [
  {
    id: "human",
    name: "Con Người",
    subraces: [
      { id: "warrior", name: "Chiến Binh", baseStats: { vigor: 12, mind: 5, strength: 14, dexterity: 10, intelligence: 5, faith: 5, agility: 8 } },
      { id: "mage", name: "Pháp Sư", baseStats: { vigor: 8, mind: 14, strength: 5, dexterity: 8, intelligence: 15, faith: 8, agility: 6 } }
    ]
  },
  {
    id: "elf",
    name: "Tộc Elf",
    subraces: [
      { id: "high_elf", name: "Cao Tộc Elf", baseStats: { vigor: 8, mind: 12, strength: 6, dexterity: 12, intelligence: 12, faith: 10, agility: 10 } },
      { id: "night_elf", name: "Sát Thủ Elf", baseStats: { vigor: 9, mind: 8, strength: 8, dexterity: 15, intelligence: 6, faith: 5, agility: 14 } }
    ]
  }
];