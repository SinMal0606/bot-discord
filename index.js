require('dotenv').config();
const { 
  Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, 
  ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, REST, Routes 
} = require('discord.js');
const { Agent } = require('undici');

const races = require('./data/races');
const weapons = require('./data/weapons');
const buffs = require('./data/buffs');
const armors = require('./data/armor');
const monsters = require('./data/monsters');
const spells = require('./data/spells');
const staves = require('./data/staves');
const { runCombat, calculateAtk, calculateDef } = require('./combat');
const db = require('./database');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot Discord đang hoạt động!');
});

app.listen(PORT, () => {
  console.log(`Web server đang chạy trên port ${PORT}`);
});

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds],
  rest: {
    timeout: 30000,
    retries: 3,
    agent: new Agent({ connect: { timeout: 30000 } })
  }
});

const activeRuns = new Map();

function getRandomElements(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getStarterWeapon(stats) {
  const statPriority = [
    { stat: 'str', weaponId: 'w1' },
    { stat: 'dex', weaponId: 'w2' },
    { stat: 'int', weaponId: 'w3' },
    { stat: 'faith', weaponId: 'w4' }
  ];

  let highestStat = 'str';
  let maxVal = -1;

  for (const item of statPriority) {
    if (stats[item.stat] > maxVal) {
      maxVal = stats[item.stat];
      highestStat = item.stat;
    }
  }

  const foundWeapon = weapons.find(w => w.id === statPriority.find(i => i.stat === highestStat).weaponId);
  return foundWeapon || weapons[0];
}

// --- ĐĂNG KÝ SLASH COMMANDS VỚI DISCORD API ---
const commands = [
  new SlashCommandBuilder().setName('start-run').setDescription('Bắt đầu lượt chơi mới'),
  new SlashCommandBuilder().setName('profile').setDescription('Xem thông tin và số vàng hiện có')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.on('clientReady', async () => {
  console.log(`Bot ${client.user.tag} đã sẵn sàng!`);
  
  // Tự động đăng ký Slash Commands
  try {
    console.log('🔄 Đang đăng ký Slash Commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Đăng ký Slash Commands thành công! (/start-run, /profile)');
  } catch (error) {
    console.error('❌ Lỗi đăng ký Slash Commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    const userId = interaction.user.id;

    // Kiểm tra chính chủ
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      const customIdUser = interaction.customId.split(':')[1];
      if (customIdUser && customIdUser !== userId) {
        return interaction.reply({ content: '❌ Đây không phải là lượt chơi của bạn!', ephemeral: true });
      }
    }

    // --- 1. XỬ LÝ SLASH COMMANDS ---
    if (interaction.isChatInputCommand()) {
      
      // Lệnh /profile
      if (interaction.commandName === 'profile') {
        await interaction.deferReply();

        // Lấy tổng số vàng tích lũy từ Database
        const totalGold = await db.getPlayerGold(userId);

        // Link Avatar người dùng
        const userAvatar = interaction.user.displayAvatarURL({ dynamic: true, size: 256 });

        const simpleProfileEmbed = new EmbedBuilder()
          .setColor(0xF1C40F)
          .setTitle(`📜 Hồ Sơ Hiệp Sĩ`)
          .setThumbnail(userAvatar)
          .addFields(
            { 
              name: '👤 Tên Hiệp Sĩ', 
              value: `**${interaction.user.username}**`, 
              inline: true 
            },
            { 
              name: '💰 Tổng Vàng Sở Hữu', 
              value: `\`${totalGold}\` Gold`, 
              inline: true 
            }
          )
          .setFooter({ text: 'Discord Roguelike Bot', iconURL: interaction.client.user.displayAvatarURL() })
          .setTimestamp();

        return interaction.editReply({ embeds: [simpleProfileEmbed] });
      }

      // Lệnh /start-run
      if (interaction.commandName === 'start-run') {
        await interaction.deferReply();

        if (activeRuns.has(userId)) {
          const currentRun = activeRuns.get(userId);
          
          const busyEmbed = new EmbedBuilder()
            .setColor(0xFF9900)
            .setTitle('⚠️ Bạn đang có một lượt chơi chưa kết thúc!')
            .setDescription(`Bạn đang dừng chân tại **Phòng ${currentRun.room}** với nhân vật **${currentRun.raceName}**.\nBạn muốn tiếp tục hay hủy bỏ để tạo run mới?`);

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`resume_run:${userId}`).setLabel('Tiếp tục Run cũ').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`force_abandon:${userId}`).setLabel('Hủy Run cũ & Tạo mới').setStyle(ButtonStyle.Danger)
          );

          return interaction.editReply({ embeds: [busyEmbed], components: [row] });
        }

        const raceKeys = Object.keys(races);
        const randomRaceKey = raceKeys[Math.floor(Math.random() * raceKeys.length)];
        const raceData = races[randomRaceKey];

        const subKeys = Object.keys(raceData.subraces);
        const randomSubKey = subKeys[Math.floor(Math.random() * subKeys.length)];
        const subData = raceData.subraces[randomSubKey];

        const starterWeapon = getStarterWeapon(subData);
        const maxHp = subData.vigor * 10;
        const maxMp = subData.mind * 10;

        const playerData = {
          name: interaction.user.username,
          userId: userId,
          raceName: subData.name,
          stats: { ...subData },
          maxHp: maxHp,
          hp: maxHp,
          maxMp: maxMp,
          mp: maxMp,
          weapon: starterWeapon,
          armor: null,
          staff: null,
          spell: null,
          gold: 0,
          room: 0
        };

        activeRuns.set(userId, playerData);

        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle(`🎲 Khởi Tạo Nhân Vật Ngẫu Nhiên`)
          .setDescription(`Bạn là **${subData.name}**\n🗡️ **Vũ khí khởi đầu:** ${starterWeapon.name}`)
          .addFields(
            { name: '❤️ Vigor', value: `${subData.vigor}`, inline: true },
            { name: '🧪 Mind', value: `${subData.mind}`, inline: true },
            { name: '⚔️ STR', value: `${subData.str}`, inline: true },
            { name: '🎯 DEX', value: `${subData.dex}`, inline: true },
            { name: '🔮 INT', value: `${subData.int}`, inline: true },
            { name: '✨ FAITH', value: `${subData.faith}`, inline: true }
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`next_room:${userId}`).setLabel('Tiến vào Phòng 1').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`abandon_run:${userId}`).setLabel('Rút lui').setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
      }
    }

    // --- 2. XỬ LÝ CÁC NÚT BẤM ---
    if (interaction.isButton()) {
      const action = interaction.customId.split(':')[0];

      if (action === 'resume_run') {
        const player = activeRuns.get(userId);
        const statusEmbed = new EmbedBuilder()
          .setColor(0x00FFFF)
          .setTitle(`🛡️ Trạng Thái Trận Đấu Đang Tiếp Tục`)
          .setDescription(`Bạn đang ở Phòng **${player.room}**`)
          .addFields(
            { name: '❤️ HP', value: `${player.hp}/${player.maxHp}`, inline: true },
            { name: '⚔️ ATK', value: `${calculateAtk(player)}`, inline: true },
            { name: '🛡️ DEF', value: `${calculateDef(player)}`, inline: true }
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`next_room:${userId}`).setLabel(`Tiến vào Phòng ${player.room + 1}`).setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`abandon_run:${userId}`).setLabel('Rút lui').setStyle(ButtonStyle.Danger)
        );

        return interaction.update({ embeds: [statusEmbed], components: [row] });
      }

      if (action === 'force_abandon') {
        activeRuns.delete(userId);
        return interaction.update({ 
          embeds: [new EmbedBuilder().setTitle('🗑️ Đã xóa run cũ! Hãy gõ `/start-run` để bắt đầu lại.').setColor(0xFF0000)], 
          components: [] 
        });
      }

      const player = activeRuns.get(userId);
      if (!player && action !== 'save_build') {
        return interaction.reply({ content: '❌ Lượt chơi này đã kết thúc hoặc không còn tồn tại.', ephemeral: true });
      }

      if (action === 'abandon_run') {
        activeRuns.delete(userId);
        return interaction.update({ 
          embeds: [
            new EmbedBuilder()
              .setTitle('🚪 Rút Lui Thành Công')
              .setDescription(`Bạn đã bỏ cuộc tại **Phòng ${player.room}**. Tiến trình lượt này đã bị hủy.`)
              .setColor(0x888888)
          ], 
          components: [] 
        });
      }

      if (action === 'next_room') {
        await interaction.deferUpdate();
        player.room += 1;

        await interaction.editReply({ 
          embeds: [new EmbedBuilder().setTitle(`🚪 Đang tiến vào Phòng ${player.room}...`).setColor(0xFFFF00)], 
          components: [] 
        });

        let currentMonster;
        if (monsters.bosses && monsters.bosses[player.room]) {
          currentMonster = monsters.bosses[player.room];
        } else {
          const eligibleMonsters = monsters.normalMonsters.filter(
            m => player.room >= m.minRoom && player.room <= m.maxRoom
          );
          const pool = eligibleMonsters.length > 0 
            ? eligibleMonsters 
            : monsters.normalMonsters.filter(m => m.minRoom === 11);

          currentMonster = getRandomElements(pool, 1)[0];
        }

        const isAlive = await runCombat(interaction, player, currentMonster);

        if (isAlive) {
          if (player.room === 15) {
            const victoryEmbed = new EmbedBuilder()
              .setColor(0xFFD700)
              .setTitle(`🎉 CHÚC MỪNG! BẠN ĐÃ ĐÁNH BẠI BOSS VÀ HOÀN THÀNH RUN!`)
              .setDescription(`Bạn đã tiêu diệt **${currentMonster.name}** tại Phòng 15 thành công!`);

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`save_build:${userId}`).setLabel('Lưu vào Danh Sách Build').setStyle(ButtonStyle.Success)
            );

            return await interaction.editReply({ embeds: [victoryEmbed], components: [row] });
          }

          const allPossibleRewards = [
            ...weapons.map(w => ({ ...w, itemType: 'weapon' })),
            ...armors.map(a => ({ ...a, itemType: 'armor' })),
            ...buffs.map(b => ({ ...b, itemType: 'buff' })),
            ...staves.map(st => ({ ...st, itemType: 'staff' })),
            ...spells.map(sp => ({ ...sp, itemType: 'spell' }))
          ];

          const randomRewards = getRandomElements(allPossibleRewards, 3);
          let rewardDetailText = "";
          const rewardOptions = [];
          const rewardMap = {};

          const isBoss = player.room % 5 === 0;
          const earnedGold = isBoss 
            ? Math.floor(Math.random() * 301) + 200 
            : Math.floor(Math.random() * 31) + 20; 
          player.gold = (player.gold || 0) + earnedGold;

          randomRewards.forEach((item, index) => {
            const uniqueKey = `${item.itemType}_${item.id}_${index}`;
            rewardMap[uniqueKey] = item;

            if (item.itemType === 'weapon') {
              rewardDetailText += `• **[Vũ Khí] ${item.name}**: ATK \`${item.baseAtk}\` (${item.type})\n`;
              rewardOptions.push({
                label: `[Vũ Khí] ${item.name}`,
                value: uniqueKey,
                description: `ATK: ${item.baseAtk} | Hệ: ${item.type}`
              });
            } else if (item.itemType === 'staff') {
                const scalePercent = Math.round((item.scaleInt || 0) * 100);
                const detail = `Base: ${item.basePower} | Scale: ${scalePercent}% INT | +${item.manaBonus} MP`;
                
                rewardDetailText += `• **[Gậy Phép] ${item.name}**: Sức mạnh \`${item.basePower}\` (+${scalePercent}% INT) | +\`${item.manaBonus}\` MP\n`;
                rewardOptions.push({
                  label: `[Gậy Phép] ${item.name}`,
                  value: uniqueKey,
                  description: detail.length > 50 ? detail.substring(0, 47) + '...' : detail
                });
            } else if (item.itemType === 'spell') {
              rewardDetailText += `• **[Phép] ${item.name}**: Tốn ${item.cost} MP | Hệ ${item.type}\n`;
              rewardOptions.push({
                label: `[Phép] ${item.name}`,
                value: uniqueKey,
                description: `Tốn ${item.cost} MP | Hệ ${item.type}`
              });
            } else if (item.itemType === 'armor') {
              rewardDetailText += `• **[Giáp] ${item.name}**: +\`${item.hpBonus}\` HP | +\`${item.defBonus}\` DEF\n`;
              rewardOptions.push({
                label: `[Giáp] ${item.name}`,
                value: uniqueKey,
                description: `+${item.hpBonus || 0} HP | +${item.defBonus || 0} DEF`
              });
            } else if (item.itemType === 'buff') {
              let buffText = [];
              if (item.strBonus) buffText.push(`+${item.strBonus} STR`);
              if (item.dexBonus) buffText.push(`+${item.dexBonus} DEX`);
              if (item.intBonus) buffText.push(`+${item.intBonus} INT`);
              if (item.faithBonus) buffText.push(`+${item.faithBonus} FAITH`);
              if (item.hpBonus) buffText.push(`+${item.hpBonus} HP`);
              
              const descString = buffText.join(', ') || 'Tăng chỉ số nhân vật';

              rewardDetailText += `• **[Buff] ${item.name}**: ${descString}\n`;
              rewardOptions.push({
                label: `[Buff] ${item.name}`,
                value: uniqueKey,
                description: descString
              });
            }
          });

          rewardOptions.push({
            label: `❌ Bỏ qua phần thưởng`,
            value: `skip_reward`,
            description: `Không lấy đồ, giữ nguyên trang bị hiện tại.`
          });

          player.currentRewardMap = rewardMap;

          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`select_reward:${userId}`)
              .setPlaceholder('Chọn 1 chiến lợi phẩm hoặc Bỏ qua...')
              .addOptions(rewardOptions)
          );

          const hpRegen = Math.round(player.maxHp * 0.25);
          const mpRegen = Math.round(player.maxMp * 0.50);

          player.hp = Math.min(player.maxHp, player.hp + hpRegen);
          player.mp = Math.min(player.maxMp, player.mp + mpRegen);

          const winEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`🎉 Thắng Phòng ${player.room}!`)
            .setDescription(
              `Bạn đã tiêu diệt **${currentMonster.name}**!\n` +
              `💰 **Phần thưởng:** +\`${earnedGold}\` Gold (Hiện có: \`${player.gold}\` Gold)\n` +
              `💚 **Hồi phục:** +\`${hpRegen}\` HP | +\`${mpRegen}\` MP`
            );

          await interaction.editReply({ embeds: [winEmbed], components: [row] });
        } else {
          const loseEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`☠️ BẠN ĐÃ HY SINH!`)
            .setDescription(`Hành trình kết thúc tại **Phòng ${player.room}** bởi **${currentMonster.name}**.`)
            .addFields(
              { name: '👤 Nhân vật', value: `${player.raceName}`, inline: true },
              { name: '🗡️ Vũ khí cuối', value: player.weapon ? player.weapon.name : 'Chưa có', inline: true },
              { name: '🛡️ Giáp cuối', value: player.armor ? player.armor.name : 'Chưa có', inline: true },
              { name: '📊 Chỉ số cuối', value: `STR: ${player.stats.str} | DEX: ${player.stats.dex} | INT: ${player.stats.int} | FAITH: ${player.stats.faith}` }
            );

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`save_build:${userId}`).setLabel('💾 Lưu vào Builds').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`force_abandon:${userId}`).setLabel('🔄 Tạo Run Mới').setStyle(ButtonStyle.Success)
          );

          await interaction.editReply({ embeds: [loseEmbed], components: [row] });
          await db.addPlayerGold(userId, earnedGold);
        }
      }

      if (action === 'save_build') {
        const pData = activeRuns.get(userId);
        if (pData) {
          // 1. Cập nhật số vàng kiếm được trong lượt vào Database
          if (pData.gold > 0) {
            await db.addPlayerGold(pData.userId, pData.gold);
          }
          
          // 2. Lưu thông tin Build
          if (db.saveBuild) {
            db.saveBuild(pData.userId, pData.raceName, pData.weapon ? pData.weapon.name : 'Vũ khí thô', pData.room);
          }

          // 3. Xóa run khỏi bộ nhớ RAM
          activeRuns.delete(userId);
        }

        await interaction.update({ 
          embeds: [new EmbedBuilder().setTitle('💾 Đã lưu Build và Vàng thành công!').setColor(0x00FF00)], 
          components: [] 
        });
      }
    }

    // --- 3. XỬ LÝ SELECT MENU PHẦN THƯỞNG ---
    if (interaction.isStringSelectMenu()) {
      const action = interaction.customId.split(':')[0];

      if (action === 'select_reward') {
        const player = activeRuns.get(userId);
        if (!player) return;

        const selectedKey = interaction.values[0];

        if (selectedKey === 'skip_reward') {
          player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.25));
        } else {
          const selectedItem = player.currentRewardMap ? player.currentRewardMap[selectedKey] : null;
          if (selectedItem) {
            if (selectedItem.itemType === 'weapon') {
              player.weapon = selectedItem;
            } else if (selectedItem.itemType === 'armor') {
              player.armor = selectedItem;
              player.maxHp += selectedItem.hpBonus;
            } else if (selectedItem.itemType === 'staff') {
              player.staff = selectedItem;
              player.maxMp += selectedItem.manaBonus;
            } else if (selectedItem.itemType === 'spell') {
              player.spell = selectedItem;
            } else if (selectedItem.itemType === 'buff') {
              if (selectedItem.strBonus) player.stats.str += selectedItem.strBonus;
              if (selectedItem.dexBonus) player.stats.dex += selectedItem.dexBonus;
              if (selectedItem.intBonus) player.stats.int += selectedItem.intBonus;
              if (selectedItem.faithBonus) player.stats.faith += selectedItem.faithBonus;
              if (selectedItem.hpBonus) player.maxHp += selectedItem.hpBonus;
            }
          }
          player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.25));
          player.mp = Math.min(player.maxMp, player.mp + Math.round(player.maxMp * 0.50));
        }

        const statusEmbed = new EmbedBuilder()
          .setColor(0x00FFFF)
          .setTitle(`🛡️ Trạng Thái Nhân Vật`)
          .addFields(
            { name: '❤️ HP', value: `${player.hp}/${player.maxHp}`, inline: true },
            { name: '🧪 MP', value: `${player.mp}/${player.maxMp}`, inline: true },
            { name: '🗡️ Vũ Khí', value: player.weapon ? player.weapon.name : 'Chưa có', inline: true },
            { name: '🪄 Gậy Phép', value: player.staff ? player.staff.name : 'Chưa có', inline: true },
            { name: '📜 Phép Thuật', value: player.spell ? player.spell.name : 'Chưa học', inline: true },
            { name: '🛡️ Giáp', value: player.armor ? player.armor.name : 'Chưa có', inline: true }
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`next_room:${userId}`).setLabel(`Tiến vào Phòng ${player.room + 1}`).setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`abandon_run:${userId}`).setLabel('Rút lui').setStyle(ButtonStyle.Danger)
        );

        await interaction.update({ embeds: [statusEmbed], components: [row] });
      }
    }
  } catch (error) {
    if (error.code === 10062) {
      console.warn('⚠️ Interaction expired due to network delay.');
    } else {
      console.error('Unhandled interaction error:', error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);