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
const { runCombat } = require('./combat');
const db = require('./database');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Catch Unhandled Errors để ngăn Server Crash (Status 1)
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception thrown:', err);
});

app.get('/', (req, res) => {
  res.send('Bot Discord đang hoạt động!');
});

app.listen(PORT, () => {
  console.log(`Web server đang chạy trên port ${PORT}`);
});

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ CRITICAL ERROR: Thiếu DISCORD_TOKEN trong biến môi trường (Environment Variables)!');
  process.exit(1);
}

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
  if (!arr || !Array.isArray(arr) || arr.length === 0) return [];
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

function generatePathChoices(userId, roomNumber) {
  if (roomNumber === 10 || roomNumber === 20 || roomNumber === 30) {
    const bossName = roomNumber === 30 ? "TRÙM CUỐI: Chúa Tể Vô Vực" : `MINI-BOSS Phòng ${roomNumber}`;
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`choose_path:monster:${userId}`)
        .setLabel(`⚔️ Khiêu Chiến ${bossName}`)
        .setStyle(ButtonStyle.Danger)
    );
  }

  const pool = [
    { id: 'monster', label: '⚔️ Quái Thường', style: ButtonStyle.Primary },
    { id: 'monster', label: '⚔️ Quái Thường', style: ButtonStyle.Primary },
    { id: 'shop', label: '🛒 Cửa Hàng Rune', style: ButtonStyle.Success },
    { id: 'rest', label: '🏕️ Trạm Nghỉ Chân', style: ButtonStyle.Secondary },
    { id: 'chest', label: '💎 Rương Báu Rune', style: ButtonStyle.Success }
  ];

  const selected = getRandomElements(pool, 3);
  const row = new ActionRowBuilder();

  selected.forEach((choice, idx) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`choose_path:${choice.id}:${userId}:${idx}`)
        .setLabel(`Hướng ${idx + 1}: ${choice.label}`)
        .setStyle(choice.style)
    );
  });

  return row;
}

const commands = [
  new SlashCommandBuilder().setName('start-run').setDescription('Bắt đầu lượt chơi mới (30 Phòng)'),
  new SlashCommandBuilder().setName('profile').setDescription('Xem thông tin và số vàng hiện có')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Sửa lại thành 'ready' chuẩn Discord.js
client.on('ready', async () => {
  console.log(`Bot ${client.user.tag} đã sẵn sàng!`);
  try {
    console.log('🔄 Đang đăng ký Slash Commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Đăng ký Slash Commands thành công!');
  } catch (error) {
    console.error('❌ Lỗi đăng ký Slash Commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    const userId = interaction.user.id;

    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      const parts = interaction.customId.split(':');
      const customIdUser = parts[2] || parts[1];
      if (customIdUser && customIdUser !== userId) {
        return interaction.reply({ content: '❌ Đây không phải là lượt chơi của bạn!', ephemeral: true });
      }
    }

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'profile') {
        await interaction.deferReply();
        const totalGold = await db.getPlayerGold(userId);
        const userAvatar = interaction.user.displayAvatarURL({ dynamic: true, size: 256 });

        const simpleProfileEmbed = new EmbedBuilder()
          .setColor(0xF1C40F)
          .setTitle(`📜 Hồ Sơ Hiệp Sĩ`)
          .setThumbnail(userAvatar)
          .addFields(
            { name: '👤 Tên Hiệp Sĩ', value: `**${interaction.user.username}**`, inline: true },
            { name: '💰 Tổng Vàng Sở Hữu', value: `\`${totalGold}\` Gold`, inline: true }
          )
          .setFooter({ text: 'Discord Roguelike Bot', iconURL: interaction.client.user.displayAvatarURL() })
          .setTimestamp();

        return interaction.editReply({ embeds: [simpleProfileEmbed] });
      }

      if (interaction.commandName === 'start-run') {
        await interaction.deferReply();

        if (activeRuns.has(userId)) {
          const currentRun = activeRuns.get(userId);
          const busyEmbed = new EmbedBuilder()
            .setColor(0xFF9900)
            .setTitle('⚠️ Bạn đang có một lượt chơi chưa kết thúc!')
            .setDescription(`Bạn đang dừng chân tại **Phòng ${currentRun.room}** với nhân vật **${currentRun.raceName}**.\nBạn muốn tiếp tục hay hủy bỏ?`);

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
          runes: 50,
          room: 1
        };

        activeRuns.set(userId, playerData);

        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle(`🎲 Bắt Đầu Hành Trình 30 Phòng Dungeon`)
          .setDescription(`Bạn là **${subData.name}**\n🗡️ **Vũ khí:** ${starterWeapon.name}\n🔮 **Rune khởi đầu:** \`50\` Runes`)
          .addFields(
            { name: '❤️ Vigor', value: `${subData.vigor}`, inline: true },
            { name: '🧪 Mind', value: `${subData.mind}`, inline: true },
            { name: '⚔️ STR', value: `${subData.str}`, inline: true },
            { name: '🎯 DEX', value: `${subData.dex}`, inline: true },
            { name: '🔮 INT', value: `${subData.int}`, inline: true },
            { name: '✨ FAITH', value: `${subData.faith}`, inline: true }
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`start_first_room:${userId}`).setLabel('Tiến vào Dungeon (Phòng 1)').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`abandon_run:${userId}`).setLabel('Rút lui').setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
      }
    }

    if (interaction.isButton()) {
      const parts = interaction.customId.split(':');
      const action = parts[0];

      if (action === 'resume_run') {
        const player = activeRuns.get(userId);
        if (!player) return interaction.reply({ content: '❌ Lượt chơi không tồn tại.', ephemeral: true });

        const pathRow = generatePathChoices(userId, player.room);

        const statusEmbed = new EmbedBuilder()
          .setColor(0x00FFFF)
          .setTitle(`🛡️ Chuẩn Bị Vào Phòng ${player.room}`)
          .setDescription(`❤️ HP: \`${player.hp}/${player.maxHp}\` | 🔮 Runes: \`${player.runes}\`\nHãy chọn 1 trong các đường đi phía dưới:`);

        return interaction.update({ embeds: [statusEmbed], components: [pathRow] });
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
          embeds: [new EmbedBuilder().setTitle('🚪 Rút Lui Thành Công').setDescription(`Dừng chân tại Phòng ${player ? player.room : 0}.`).setColor(0x888888)], 
          components: [] 
        });
      }

      if (action === 'start_first_room') {
        await interaction.deferUpdate();
        player.room = 1;
        const pathRow = generatePathChoices(userId, 1);
        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle(`🚪 Cửa Vào Dungeon - Phòng 1`)
          .setDescription(`Hãy chọn 1 trong 3 con đường phía trước để dấn thân vào nguy hiểm:`);

        return interaction.editReply({ embeds: [embed], components: [pathRow] });
      }

      if (action === 'choose_path') {
        const pathType = parts[1];
        await interaction.deferUpdate();

        if (pathType === 'rest') {
          const healHp = Math.round(player.maxHp * 0.4);
          const healMp = Math.round(player.maxMp * 0.5);
          player.hp = Math.min(player.maxHp, player.hp + healHp);
          player.mp = Math.min(player.maxMp, player.mp + healMp);

          const restEmbed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle(`🏕️ Trạm Nghỉ Chân (Phòng ${player.room})`)
            .setDescription(`Bạn tìm thấy một đống lửa an toàn để nghỉ ngơi.\n❤️ Hồi \`+${healHp}\` HP (${player.hp}/${player.maxHp})\n🧪 Hồi \`+${healMp}\` MP (${player.mp}/${player.maxMp})`);

          player.room += 1;
          const pathRow = generatePathChoices(userId, player.room);
          return interaction.editReply({ embeds: [restEmbed], components: [pathRow] });
        }

        if (pathType === 'chest') {
          const foundRunes = Math.floor(Math.random() * 41) + 30;
          player.runes += foundRunes;

          const chestEmbed = new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTitle(`💎 Mở Rương Báu (Phòng ${player.room})`)
            .setDescription(`Bạn tìm thấy một rương cổ chứa đầy ma thuật!\n🔮 Nhận được: \`+${foundRunes}\` Runes (Tổng: \`${player.runes}\` Runes)`);

          player.room += 1;
          const pathRow = generatePathChoices(userId, player.room);
          return interaction.editReply({ embeds: [chestEmbed], components: [pathRow] });
        }

        if (pathType === 'shop') {
          const shopEmbed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle(`🛒 Cửa Hàng Rune Bí Mật (Phòng ${player.room})`)
            .setDescription(`Chào mừng! Bạn đang có **\`${player.runes}\` Runes**.\nHãy chọn món đồ bạn muốn mua từ danh sách bên dưới:`);

          const shopOptions = [
            { label: '🧪 Bình Máu (Hồi 50% HP)', value: 'item_heal', description: 'Giá: 30 Runes' },
            { label: '⚔️ Bùa Cường Hóa (+5 STR & DEX)', value: 'item_str', description: 'Giá: 60 Runes' },
            { label: '🔮 Bùa Phù Thủy (+5 INT & FAITH)', value: 'item_int', description: 'Giá: 60 Runes' },
            { label: '🛡️ Huyết Thạch (+30 Max HP)', value: 'item_hp', description: 'Giá: 80 Runes' },
            { label: '🚪 Không mua gì cả, đi tiếp', value: 'item_skip', description: 'Rời cửa hàng' }
          ];

          const shopRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`buy_shop:${userId}`)
              .setPlaceholder('Chọn vật phẩm để mua...')
              .addOptions(shopOptions)
          );

          return interaction.editReply({ embeds: [shopEmbed], components: [shopRow] });
        }

        if (pathType === 'monster') {
          await interaction.editReply({ 
            embeds: [new EmbedBuilder().setTitle(`⚔️ Đang chiến đấu tại Phòng ${player.room}...`).setColor(0xFF0000)], 
            components: [] 
          });

          let currentMonster;
          if (monsters.bosses && monsters.bosses[player.room]) {
            currentMonster = monsters.bosses[player.room];
          } else {
            const eligibleMonsters = (monsters.normalMonsters || []).filter(
              m => player.room >= m.minRoom && player.room <= m.maxRoom
            );
            const pool = eligibleMonsters.length > 0 ? eligibleMonsters : (monsters.normalMonsters || []);
            currentMonster = getRandomElements(pool, 1)[0];
          }

          const isAlive = await runCombat(interaction, player, currentMonster);

          if (isAlive) {
            if (player.room === 30) {
              const victoryEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🏆 CHÚC MỪNG! BẠN ĐÃ TIÊU DIỆT TRÙM CUỐI VÀ PHÁ ĐẢO DUNGEON!`)
                .setDescription(`Bạn đã đánh bại **${currentMonster.name}** tại Phòng 30 xuất sắc!`);

              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`save_build:${userId}`).setLabel('💾 Lưu Build & Nhận Vàng').setStyle(ButtonStyle.Success)
              );

              return await interaction.editReply({ embeds: [victoryEmbed], components: [row] });
            }

            const isBoss = player.room % 10 === 0;
            const earnedGold = isBoss ? Math.floor(Math.random() * 301) + 300 : Math.floor(Math.random() * 41) + 20;
            const earnedRunes = isBoss ? Math.floor(Math.random() * 101) + 100 : Math.floor(Math.random() * 21) + 15;

            player.gold += earnedGold;
            player.runes += earnedRunes;

            const allPossibleRewards = [
              ...(weapons || []).map(w => ({ ...w, itemType: 'weapon' })),
              ...(armors || []).map(a => ({ ...a, itemType: 'armor' })),
              ...(buffs || []).map(b => ({ ...b, itemType: 'buff' })),
              ...(staves || []).map(st => ({ ...st, itemType: 'staff' })),
              ...(spells || []).map(sp => ({ ...sp, itemType: 'spell' }))
            ];

            const randomRewards = getRandomElements(allPossibleRewards, 3);
            const rewardOptions = [];
            const rewardMap = {};

            randomRewards.forEach((item, index) => {
              const uniqueKey = `${item.itemType}_${item.id}_${index}`;
              rewardMap[uniqueKey] = item;
              rewardOptions.push({
                label: `[${item.itemType.toUpperCase()}] ${item.name}`,
                value: uniqueKey,
                description: `Rơi ra từ ${currentMonster.name}`
              });
            });

            rewardOptions.push({ label: '❌ Bỏ qua đồ', value: 'skip_reward', description: 'Không lấy thiết bị này' });
            player.currentRewardMap = rewardMap;

            const row = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`select_reward:${userId}`)
                .setPlaceholder('Chọn chiến lợi phẩm...')
                .addOptions(rewardOptions)
            );

            const winEmbed = new EmbedBuilder()
              .setColor(0x00FF00)
              .setTitle(`🎉 HẠ GỤC ${currentMonster.name.toUpperCase()}!`)
              .setDescription(
                `💰 **Thưởng:** +\`${earnedGold}\` Gold | 🔮 +\`${earnedRunes}\` Runes (Hiện có: \`${player.runes}\` Runes)\n` +
                `Chọn 1 món đồ thưởng bên dưới để tiếp tục:`
              );

            await interaction.editReply({ embeds: [winEmbed], components: [row] });
          } else {
            const loseEmbed = new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle(`☠️ BẠN ĐÃ HY SINH!`)
              .setDescription(`Hành trình kết thúc tại **Phòng ${player.room}** bởi **${currentMonster.name}**.`)
              .addFields(
                { name: '👤 Nhân vật', value: `${player.raceName}`, inline: true },
                { name: '📊 Tiến trình', value: `Phòng ${player.room}/30`, inline: true }
              );

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`save_build:${userId}`).setLabel('💾 Lưu Vàng & Kết thúc').setStyle(ButtonStyle.Primary)
            );

            await interaction.editReply({ embeds: [loseEmbed], components: [row] });
          }
        }
      }

      if (action === 'save_build') {
        // 1. Hoãn phản hồi ngay lập tức để Discord không báo timeout 3 giây
        await interaction.deferUpdate();

        const pData = activeRuns.get(userId);
        if (pData) {
          try {
            // 2. Thực hiện ghi dữ liệu vào DB (cho dù tốn vài giây vẫn an toàn)
            if (pData.gold > 0) {
              await db.addPlayerGold(pData.userId, pData.gold);
            }
            if (db.saveBuild) {
              await db.saveBuild(pData.userId, pData.raceName, pData.weapon ? pData.weapon.name : 'Vũ khí thô', pData.room);
            }
          } catch (dbError) {
            console.error('❌ Lỗi khi lưu dữ liệu vào DB:', dbError);
          } finally {
            // 3. Xóa lượt chơi khỏi bộ nhớ tạm
            activeRuns.delete(userId);
          }
        }

        // 4. Cập nhật lại giao diện sau khi đã hoàn tất lưu dữ liệu
        return interaction.editReply({ 
          embeds: [
            new EmbedBuilder()
              .setTitle('💾 Đã lưu thành công!')
              .setDescription('Toàn bộ số vàng tích lũy đã được chuyển vào tài khoản của bạn. Hãy dùng `/start-run` để bắt đầu lượt mới!')
              .setColor(0x00FF00)
          ], 
          components: [] 
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      const parts = interaction.customId.split(':');
      const action = parts[0];

      if (action === 'buy_shop') {
        const player = activeRuns.get(userId);
        if (!player) return;

        const val = interaction.values[0];
        let msg = "";

        if (val === 'item_heal') {
          if (player.runes >= 30) {
            player.runes -= 30;
            player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.5));
            msg = "✅ Bạn đã mua Bình Máu và hồi 50% HP!";
          } else msg = "❌ Bạn không đủ Runes!";
        } else if (val === 'item_str') {
          if (player.runes >= 60) {
            player.runes -= 60;
            player.stats.str += 5;
            player.stats.dex += 5;
            msg = "✅ Bạn đã mua Bùa Cường Hóa (+5 STR, +5 DEX)!";
          } else msg = "❌ Bạn không đủ Runes!";
        } else if (val === 'item_int') {
          if (player.runes >= 60) {
            player.runes -= 60;
            player.stats.int += 5;
            player.stats.faith += 5;
            msg = "✅ Bạn đã mua Bùa Phù Thủy (+5 INT, +5 FAITH)!";
          } else msg = "❌ Bạn không đủ Runes!";
        } else if (val === 'item_hp') {
          if (player.runes >= 80) {
            player.runes -= 80;
            player.maxHp += 30;
            player.hp += 30;
            msg = "✅ Bạn đã mua Huyết Thạch (+30 Max HP)!";
          } else msg = "❌ Bạn không đủ Runes!";
        } else {
          msg = "🚪 Bạn rời khỏi Cửa hàng mà không mua gì.";
        }

        player.room += 1;
        const pathRow = generatePathChoices(userId, player.room);

        const resEmbed = new EmbedBuilder()
          .setColor(0x9B59B6)
          .setTitle(`🛒 Kết Quả Mua Sắm`)
          .setDescription(`${msg}\n🔮 Runes còn lại: \`${player.runes}\`\nHãy chọn đường đi tiếp theo:`);

        return interaction.update({ embeds: [resEmbed], components: [pathRow] });
      }

      if (action === 'select_reward') {
        const player = activeRuns.get(userId);
        if (!player) return;

        const selectedKey = interaction.values[0];
        if (selectedKey !== 'skip_reward') {
          const selectedItem = player.currentRewardMap ? player.currentRewardMap[selectedKey] : null;
          if (selectedItem) {
            if (selectedItem.itemType === 'weapon') player.weapon = selectedItem;
            else if (selectedItem.itemType === 'armor') { player.armor = selectedItem; player.maxHp += selectedItem.hpBonus || 0; }
            else if (selectedItem.itemType === 'staff') { player.staff = selectedItem; player.maxMp += selectedItem.manaBonus || 0; }
            else if (selectedItem.itemType === 'spell') player.spell = selectedItem;
            else if (selectedItem.itemType === 'buff') {
              if (selectedItem.strBonus) player.stats.str += selectedItem.strBonus;
              if (selectedItem.dexBonus) player.stats.dex += selectedItem.dexBonus;
              if (selectedItem.intBonus) player.stats.int += selectedItem.intBonus;
              if (selectedItem.faithBonus) player.stats.faith += selectedItem.faithBonus;
            }
          }
        }

        player.room += 1;
        const pathRow = generatePathChoices(userId, player.room);

        const statusEmbed = new EmbedBuilder()
          .setColor(0x00FFFF)
          .setTitle(`🛡️ Chuẩn Bị Vào Phòng ${player.room}`)
          .setDescription(`❤️ HP: \`${player.hp}/${player.maxHp}\` | 🧪 MP: \`${player.mp}/${player.maxMp}\` | 🔮 Runes: \`${player.runes}\`\nHãy chọn đường đi tiếp theo:`);

        await interaction.update({ embeds: [statusEmbed], components: [pathRow] });
      }
    }
  } catch (error) {
    console.error('Unhandled interaction error:', error);
  }
});

client.login(process.env.DISCORD_TOKEN);