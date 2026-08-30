function calculateResistances(stats, armor) {
  return {
    physical: stats.strength * 1.5 + (armor?.resistBonus?.physical || 0),
    magic: stats.intelligence * 1.5 + (armor?.resistBonus?.magic || 0),
    fire: stats.vigor * 1.2 + (armor?.resistBonus?.fire || 0),
    lightning: stats.dexterity * 1.2 + (armor?.resistBonus?.lightning || 0),
    holy: stats.faith * 1.5 + (armor?.resistBonus?.holy || 0),
    dodgeChance: Math.min(stats.agility * 0.5, 40) // Tối đa 40% né
  };
}

function processCombatTurn(player, monster) {
  let log = [];
  const pRes = calculateResistances(player.stats, player.equipment.armor);
  
  // 1. Lượt của Người chơi (Ngẫu nhiên Dùng Vũ Khí hoặc Dùng Phép)
  const useSpell = player.spells.length > 0 && Math.random() < 0.4 && player.currentMana >= 10;
  
  if (useSpell) {
    const spell = player.spells[Math.floor(Math.random() * player.spells.length)];
    player.currentMana -= spell.manaCost;
    if (spell.type === "heal") {
      const healAmt = spell.basePower + player.stats[spell.scaling] * 1.2;
      player.currentHp = Math.min(player.maxHp, player.currentHp + healAmt);
      log.push(`✨ Bạn dùng **${spell.name}** và hồi ${Math.floor(healAmt)} HP!`);
    } else if (spell.type === "damage") {
      let dmg = spell.basePower + player.stats[spell.scaling] * 1.5;
      dmg = Math.max(1, dmg - (monster.resists[spell.damageType] || 0));
      monster.hp -= dmg;
      log.push(`🔥 Bạn niệm **${spell.name}** gây ${Math.floor(dmg)} sát thương ${spell.damageType}!`);
    }
  } else {
    // Tấn công vũ khí
    let totalDmg = 0;
    if (player.equipment.weapon) {
      for (const [dmgType, val] of Object.entries(player.equipment.weapon.damage)) {
        let scaleVal = 0;
        for (const [stat, ratio] of Object.entries(player.equipment.weapon.scaling)) {
          scaleVal += (player.stats[stat] || 0) * ratio;
        }
        let netDmg = Math.max(1, (val + scaleVal) - (monster.resists[dmgType] || 0));
        totalDmg += netDmg;
      }
    } else {
      totalDmg = Math.max(1, player.stats.strength - monster.resists.physical);
    }
    monster.hp -= totalDmg;
    log.push(`⚔️ Bạn tấn công gây ${Math.floor(totalDmg)} sát thương!`);
  }

  if (monster.hp <= 0) {
    log.push(`🎉 **${monster.name}** đã bị hạ gục!`);
    return { isDead: false, win: true, log };
  }

  // 2. Lượt của Quái vật
  const dodgeRoll = Math.random() * 100;
  if (dodgeRoll < pRes.dodgeChance) {
    log.push(`💨 Bạn đã né thành công đòn đánh của **${monster.name}**!`);
  } else {
    const skill = monster.skills[Math.floor(Math.random() * monster.skills.length)];
    let rawDmg = monster.atk * skill.multiplier;
    let finalDmg = Math.max(1, rawDmg - (pRes[skill.damageType] || 0));
    player.currentHp -= finalDmg;
    log.push(`💥 **${monster.name}** dùng **${skill.name}** gây ${Math.floor(finalDmg)} sát thương ${skill.damageType}!`);
  }

  if (player.currentHp <= 0) {
    log.push(`💀 Bạn đã bị hạ gục...`);
    return { isDead: true, win: false, log };
  }

  return { isDead: false, win: false, log };
}

module.exports = { processCombatTurn };