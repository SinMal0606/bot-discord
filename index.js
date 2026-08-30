require('dotenv').config();
const http = require('http');
const { Client, GatewayIntentBits, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { connectDB, User } = require('./database');
const races = require('./data/races');
const monsters = require('./data/monsters');
const weapons = require('./data/weapons');
const { processCombatTurn } = require('./combat');

// Giữ cho Render Web Service không bị sập port
const port = process.env.PORT || 3000;
http.createServer((req, res) => res.end('Bot is running!')).listen(port);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
  await connectDB();
  console.log(`Logged in as ${client.user.tag}!`);
});

// Đăng ký Slash Commands
const commands = [
  { name: 'start-run', description: 'Bắt đầu một lượt chơi dungeon mới' },
  { name: 'abandon-run', description: 'Từ bỏ lượt chơi hiện tại' },
  { name: 'profile', description: 'Xem thông tin cá nhân và số vàng' },
  { name: 'help', description: 'Hướng dẫn chơi game cho người mới' }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('Registered slash commands successfully.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();

// Xử lý Lệnh Slash & Interactions
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName, user } = interaction;

      if (commandName === 'help') {
        const helpEmbed = new EmbedBuilder()
          .setTitle('📜 Hướng Dẫn Rogue-like RPG')
          .setDescription('Chào mừng đến với Dungeon! Hãy khám phá và sinh tồn qua 30 tầng dungeon.')
          .addFields(
            { name: 'Các Lệnh Chính', value: '`/start-run`: Bắt đầu run mới\n`/abandon-run`: Rút lui khỏi dungeon\n`/profile`: Xem vàng và thông tin' },
            { name: 'Chỉ Số', value: '**Vigor**: Máu & Kháng Lửa\n**Mind**: Mana\n**Strength**: Kháng Vật Lý\n**Dexterity**: Kháng Sét\n**Intelligence**: Kháng Phép\n**Faith**: Kháng Thần Thánh\n**Agility**: Tỉ lệ Né' },
            { name: 'Tầng Dungeon', value: 'Tầng 10 & 20 là Miniboss, tầng 30 là Boss cuối!' }
          )
          .setColor(0x0099FF);
        return await interaction.reply({ embeds: [helpEmbed] });
      }

      if (commandName === 'profile') {
        let userData = await User.findOne({ userId: user.id });
        if (!userData) userData = await User.create({ userId: user.id });

        const profileEmbed = new EmbedBuilder()
          .setTitle(`Hồ sơ của ${user.username}`)
          .setThumbnail(user.displayAvatarURL())
          .addFields({ name: '💰 Vàng tích lũy', value: `${userData.gold || 0} Gold` })
          .setColor(0xFFD700);
        return await interaction.reply({ embeds: [profileEmbed] });
      }

      if (commandName === 'start-run') {
        let userData = await User.findOne({ userId: user.id });
        if (userData?.currentRun) {
          return await interaction.reply({ content: '❌ Bạn đang có một run chưa hoàn thành! Dùng `/abandon-run` nếu muốn bỏ.', ephemeral: true });
        }

        // Tạo nút chọn Chủng Tộc (Race)
        const row = new ActionRowBuilder().addComponents(
          races.map(r => new ButtonBuilder().setCustomId(`select_race_${r.id}`).setLabel(r.name).setStyle(ButtonStyle.Primary))
        );
        return await interaction.reply({ content: '🧙 Hãy chọn **Chủng tộc** cho nhân vật:', components: [row] });
      }

      if (commandName === 'abandon-run') {
        let userData = await User.findOne({ userId: user.id });
        if (!userData?.currentRun) {
          return await interaction.reply({ content: 'Bạn không trong run nào cả!', ephemeral: true });
        }

        const currentFloor = userData.currentRun.floor || 1;
        const earnedGold = currentFloor * 10;
        userData.gold = (userData.gold || 0) + earnedGold;
        userData.currentRun = null;
        await userData.save();

        return await interaction.reply(`🏳️ Bạn đã rút lui khỏi Dungeon tại tầng ${currentFloor}. Bạn nhận được **${earnedGold} Vàng**!`);
      }
    }

    // Xử lý nút bấm (Buttons)
    if (interaction.isButton()) {
      const { customId, user } = interaction;
      let userData = await User.findOne({ userId: user.id });

      // Xử lý chọn Race
      if (customId.startsWith('select_race_')) {
        const raceId = customId.split('_')[2];
        const selectedRace = races.find(r => r.id === raceId);
        
        if (!selectedRace) {
          return await interaction.reply({ content: 'Không tìm thấy thông tin race này.', ephemeral: true });
        }

        const row = new ActionRowBuilder().addComponents(
          selectedRace.subraces.map(sr => new ButtonBuilder().setCustomId(`select_subrace_${raceId}_${sr.id}`).setLabel(sr.name).setStyle(ButtonStyle.Success))
        );
        return await interaction.update({ content: `Bạn đã chọn **${selectedRace.name}**. Hãy chọn **Hệ (Subrace)**:`, components: [row] });
      }

      // Xử lý chọn Subrace & Bắt đầu Run
      if (customId.startsWith('select_subrace_')) {
        const [, , raceId, subraceId] = customId.split('_');
        const raceObj = races.find(r => r.id === raceId);
        const subraceObj = raceObj?.subraces.find(sr => sr.id === subraceId);

        if (!subraceObj) {
          return await interaction.reply({ content: 'Không tìm thấy thông tin subrace này.', ephemeral: true });
        }

        const baseStats = subraceObj.baseStats;
        const newRun = {
          floor: 1,
          stats: baseStats,
          maxHp: baseStats.vigor * 10,
          currentHp: baseStats.vigor * 10,
          maxMana: baseStats.mind * 10,
          currentMana: baseStats.mind * 10,
          runes: 0,
          equipment: { weapon: weapons[0], armor: null, staff: null },
          spells: []
        };

        if (!userData) userData = new User({ userId: user.id });
        userData.currentRun = newRun;
        await userData.save();

        return await interaction.update({ 
          content: `🚀 Run mới bắt đầu!\n**Nhân vật:** ${subraceObj.name} ${raceObj.name}\n❤️ **HP:** ${newRun.currentHp}/${newRun.maxHp} | 💧 **Mana:** ${newRun.currentMana}/${newRun.maxMana}\n\nSử dụng `/abandon-run` nếu muốn dừng lại bất kỳ lúc nào.`, 
          components: [] 
        });
      }
    }
  } catch (err) {
    console.error("Error handling interaction:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Đã xảy ra lỗi khi xử lý lệnh này!', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);