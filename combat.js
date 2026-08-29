const { EmbedBuilder } = require('discord.js');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createHealthBar(current, max, size = 10) {
  const percentage = Math.max(0, Math.min(1, current / max));
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;
  return '🟩'.repeat(progress) + '🟥'.repeat(emptyProgress);
}

// HÀM TÍNH TỔNG KHÁNG CỦA NGƯỜI CHƠI (SCALE TỪ CHỈ SỐ + GIÁP)
function getPlayerResistances(player) {
  // Mỗi điểm chỉ số tương ứng 1% kháng (0.01). Giới hạn kháng tự nhiên tối đa là 50% (0.5)
  const baseResists = {
    physical: Math.min(0.5, player.stats.str * 0.01),
    fire: Math.min(0.5, player.stats.vigor * 0.01),
    lightning: Math.min(0.5, player.stats.dex * 0.01),
    magic: Math.min(0.5, player.stats.int * 0.01),
    holy: Math.min(0.5, player.stats.faith * 0.01)
  };

  // Cộng thêm kháng từ Giáp nếu có trang bị
  const armorResists = player.armor ? player.armor.resists || {} : {};

  return {
    physical: Math.min(0.85, baseResists.physical + (armorResists.physical || 0)),
    fire: Math.min(0.85, baseResists.fire + (armorResists.fire || 0)),
    lightning: Math.min(0.85, baseResists.lightning + (armorResists.lightning || 0)),
    magic: Math.min(0.85, baseResists.magic + (armorResists.magic || 0)),
    holy: Math.min(0.85, baseResists.holy + (armorResists.holy || 0))
  };
}

async function runCombat(interaction, player, baseMonster) {
  const monster = { ...baseMonster, maxHp: baseMonster.hp };
  const playerResists = getPlayerResistances(player);

  for (let turn = 1; player.hp > 0 && monster.hp > 0; turn++) {
    await sleep(600);

    let pDmg = 0;
    let pDmgType = "physical";
    let playerLog = "";

    // --- LƯỢT NGƯỜI CHƠI ĐÁNH ---
    const trySpell = Math.random() < 0.5;
    
    // 1. Nếu người chơi dùng Phép
    if (trySpell && player.spell && player.staff && player.mp >= player.spell.cost) {
      player.mp -= player.spell.cost;
      pDmgType = player.spell.type; // Hệ sát thương từ Phép (fire, magic, lightning, holy,...)

      const staffBase = player.staff.basePower || 0;
      const staffScale = player.staff.scaleInt || 0;
      const totalSpellPower = staffBase + Math.round(player.stats.int * staffScale);
      const totalMagicAtk = (player.stats.int + totalSpellPower) * player.spell.multiplier;

      // LẤY KHÁNG CỦA QUÁI THEO HỆ PHÉP
      let mResist = (monster.resistances && monster.resistances[pDmgType]) || 0;
      
      // Công thức: Sát thương thực tế = ATK * (1 - Kháng)
      pDmg = Math.max(1, Math.round(totalMagicAtk * (1 - mResist)));
      
      playerLog = `• Bạn tốn **${player.spell.cost} MP** xả **[${player.spell.name}]** gây **${pDmg}** DMG (${pDmgType})!`;
    } 
    // 2. Nếu người chơi đánh bằng Vũ Khí
    else {
      pDmgType = player.weapon ? player.weapon.type : "physical"; // Hệ sát thương từ Vũ Khí
      let playerAtk = player.weapon ? player.weapon.baseAtk + player.stats.str : player.stats.str;

      // LẤY KHÁNG CỦA QUÁI THEO HỆ VŨ KHÍ
      let mResist = (monster.resistances && monster.resistances[pDmgType]) || 0;
      
      pDmg = Math.max(1, Math.round(playerAtk * (1 - mResist)));
      
      playerLog = `• Bạn dùng **${player.weapon ? player.weapon.name : 'Tay không'}** gây **${pDmg}** DMG (${pDmgType})!`;
    }

    // Trừ HP của quái
    monster.hp -= pDmg;
    
    // --- 2. LƯỢT QUÁI ĐÁNH (NGẪU NHIÊN KỸ NĂNG) ---
    let monsterLog = "";
    if (monster.hp > 0) {
      // Chọn 1 skill ngẫu nhiên từ danh sách kỹ năng của quái
      const skills = monster.skills && monster.skills.length > 0 
        ? monster.skills 
        : [{ name: "Đánh Thường", multiplier: 1.0, type: "physical" }];

      const randomSkill = skills[Math.floor(Math.random() * skills.length)];
      
      // Tính sát thương dựa trên Cấp Phòng + Skill Multiplier
      const baseMonsterAtk = 10 + (player.room * 3);
      const rawMonsterDmg = baseMonsterAtk * randomSkill.multiplier;

      // Trừ theo phần trăm kháng thuộc tính của người chơi
      const pResist = playerResists[randomSkill.type] || 0;
      const mDmg = Math.max(1, Math.round(rawMonsterDmg * (1 - pResist)));

      player.hp -= mDmg;
      monsterLog = `\n• **${monster.name}** dùng kỹ năng **[${randomSkill.name}]** gây **${mDmg}** DMG (${randomSkill.type})!`;
    } else {
      monsterLog = `\n• **${monster.name}** đã bị tiêu diệt!`;
    }

    const embed = new EmbedBuilder()
      .setColor(player.hp > 0 ? 0x00FF00 : 0xFF0000)
      .setTitle(`⚔️ Trận Chiến Phòng ${player.room} - Lượt ${turn}`)
      .addFields(
        { 
          name: `👤 ${player.name} (${player.raceName})`, 
          value: `❤️ HP: ${Math.max(0, player.hp)}/${player.maxHp}\n🧪 MP: ${player.mp}/${player.maxMp}\n${createHealthBar(player.hp, player.maxHp)}`, 
          inline: true 
        },
        { 
          name: `👾 ${monster.name}`, 
          value: `❤️ HP: ${Math.max(0, monster.hp)}/${monster.maxHp}\n${createHealthBar(monster.hp, monster.maxHp)}`, 
          inline: true 
        },
        { name: "📜 Nhật ký lượt này", value: playerLog + monsterLog }
      );

    await interaction.editReply({ embeds: [embed] });
  }

  return player.hp > 0;
}

module.exports = { runCombat, getPlayerResistances };