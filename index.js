require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { connectDB, User } = require('./database');
const races = require('./data/races');
const monsters = require('./data/monsters');
const weapons = require('./data/weapons');
const { processCombatTurn } = require('./combat');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
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
  } catch (error) {
    console.error(error);
  }
})();

// Xử lý Lệnh Slash
client.on('interactionCreate', async interaction => {
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
        );
      return interaction.reply({ embeds: [helpEmbed] });
    }

    if (commandName === 'profile') {
      let userData = await User.findOne({ userId: user.id });
      if (!userData) userData = await User.create({ userId: user.id });

      const profileEmbed = new EmbedBuilder()
        .setTitle(`Hồ sơ của ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields({ name: '💰 Vàng tích lũy', value: `${userData.gold} Gold` })
        .setColor(0xFFD700);
      return interaction.reply({ embeds: [profileEmbed] });
    }

    if (commandName === 'start-run') {
      let userData = await User.findOne({ userId: user.id });
      if (userData?.currentRun) {
        return interaction.reply({ content: '❌ Bạn đang có một run chưa hoàn thành! Dùng `/abandon-run` nếu muốn bỏ.', ephemeral: true });
      }

      // Chọn Chủng Tộc (Race)
      const row = new ActionRowBuilder().addComponents(
        races.map(r => new ButtonBuilder().setCustomId(`select_race_${r.id}`).setLabel(r.name).setStyle(ButtonStyle.Primary))
      );
      return interaction.reply({ content: '🧙 Hãy chọn **Chủng tộc** cho nhân vật:', components: [row] });
    }

    if (commandName === 'abandon-run') {
      let userData = await User.findOne({ userId: user.id });
      if (!userData?.currentRun) return interaction.reply({ content: 'Bạn không trong run nào cả!', ephemeral: true });

      const earnedGold = userData.currentRun.floor * 10;
      userData.gold += earnedGold;
      userData.currentRun = null;
      await userData.save();

      return interaction.reply(`🏳️ Bạn đã rút lui khỏi Dungeon tại tầng ${userData.currentRun?.floor || 1}. Bạn nhận được **${earnedGold} Vàng**!`);
    }
  }

  // Xử lý Button Interactions
  if (interaction.isButton()) {
    const { customId, user } = interaction;
    let userData = await User.findOne({ userId: user.id });

    // Xử lý chọn Race
    if (customId.startsWith('select_race_')) {
      const raceId = customId.split('_')[2];
      const selectedRace = races.find(r => r.id === raceId);
      
      const row = new ActionRowBuilder().addComponents(
        selectedRace.subraces.map(sr => new ButtonBuilder().setCustomId(`select_subrace_${raceId}_${sr.id}`).setLabel(sr.name).setStyle(ButtonStyle.Success))
      );
      return interaction.update({ content: `Bạn đã chọn ${selectedRace.name}. Hãy chọn **Hệ (Subrace)**:`, components: [row] });
    }

    // Xử lý chọn Subrace & Khởi tạo Run
    if (customId.startsWith('select_subrace_')) {
      const [, , raceId, subraceId] = customId.split('_');
      const raceObj = races.find(r => r.id === raceId);
      const subraceObj = raceObj.subraces.find(sr => sr.id === subraceId);

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

      userData.currentRun = newRun;
      await userData.save();

      return interaction.update({ content: `🚀 Run mới bắt đầu! Bạn là **${subraceObj.name} ${raceObj.name}**.\nHP: ${newRun.currentHp}/${newRun.maxHp} | Mana: ${newRun.currentMana}/${newRun.maxMana}\nSử dụng nút bấm bên dưới để di chuyển phòng tiếp theo!`, components: [] });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);