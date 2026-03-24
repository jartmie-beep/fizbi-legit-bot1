module.exports = {
    OWNER_ROLE_NAME: 'OWNER',
    SELLER_USER_ID: '1485338157011701930',
    SHOP_NAME: 'Robux SHOP',
    EMBED_COLOR: 0x00FF00,
    LOGO_URL: 'https://customer-assets.emergentagent.com/job_legit-check-bot/artifacts/p88hv2qj_Gemini_Generated_Image_2yd1z22yd1z22yd1.png',
    TICKET_KEYWORD: 'ticket',
    LEGIT_CHECK_CHANNEL: 'legit-check'
};
index.js
require('dotenv').config();
var discord = require('discord.js');
var config = require('./config');

var client = new discord.Client({ intents: [discord.GatewayIntentBits.Guilds, discord.GatewayIntentBits.GuildMessages, discord.GatewayIntentBits.GuildMembers] });

var legitCheckCommand = new discord.SlashCommandBuilder()
    .setName('legitcheck')
    .setDescription('Tworzy embed z informacjami o zamowieniu')
    .addUserOption(function(option) { return option.setName('kupujacy').setDescription('Wybierz kupujacego').setRequired(true); });

client.once('ready', async function() {
    console.log('Bot zalogowany jako ' + client.user.tag);
    var rest = new discord.REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(discord.Routes.applicationCommands(client.user.id), { body: [legitCheckCommand.toJSON()] });
    console.log('Komendy zarejestrowane!');
});

client.on('interactionCreate', async function(interaction) {
    if (interaction.isChatInputCommand() && interaction.commandName === 'legitcheck') {
        var hasRole = interaction.member.roles.cache.some(function(role) { return role.name === config.OWNER_ROLE_NAME; });
        if (!hasRole) {
            return interaction.reply({ content: 'Nie masz uprawnien', ephemeral: true });
        }
        if (interaction.channel.name.toLowerCase().indexOf(config.TICKET_KEYWORD) === -1) {
            return interaction.reply({ content: 'Tylko na kanalach ticketowych', ephemeral: true });
        }
        var buyer = interaction.options.getUser('kupujacy');
        var modal = new discord.ModalBuilder().setCustomId('lc_' + buyer.id).setTitle('Legit Check');
        var p1 = new discord.TextInputBuilder().setCustomId('produkt').setLabel('Produkt').setStyle(discord.TextInputStyle.Short).setRequired(true);
        var p2 = new discord.TextInputBuilder().setCustomId('ilosc').setLabel('Ilosc').setStyle(discord.TextInputStyle.Short).setRequired(true);
        var p3 = new discord.TextInputBuilder().setCustomId('kwota').setLabel('Kwota PLN').setStyle(discord.TextInputStyle.Short).setRequired(true);
        var p4 = new discord.TextInputBuilder().setCustomId('metoda').setLabel('Metoda platnosci').setStyle(discord.TextInputStyle.Short).setRequired(true);
        modal.addComponents(new discord.ActionRowBuilder().addComponents(p1), new discord.ActionRowBuilder().addComponents(p2), new discord.ActionRowBuilder().addComponents(p3), new discord.ActionRowBuilder().addComponents(p4));
        await interaction.showModal(modal);
    }
    if (interaction.isModalSubmit() && interaction.customId.indexOf('lc_') === 0) {
        var odbiorca = interaction.customId.split('_')[1];
        var prod = interaction.fields.getTextInputValue('produkt');
        var ile = interaction.fields.getTextInputValue('ilosc');
        var kasa = interaction.fields.getTextInputValue('kwota');
        var met = interaction.fields.getTextInputValue('metoda');
        var kanal = interaction.guild.channels.cache.find(function(ch) { return ch.name.toLowerCase().indexOf(config.LEGIT_CHECK_CHANNEL) !== -1; });
        if (!kanal) {
            return interaction.reply({ content: 'Brak kanalu legit-check', ephemeral: true });
        }
        var embed = new discord.EmbedBuilder()
            .setTitle('✅ ' + config.SHOP_NAME + ' x LEGIT CHECK')
            .setColor(config.EMBED_COLOR)
            .setThumbnail(config.LOGO_URL)
            .setDescription('• 🛒 *xInformacje o zamowieniu:*\n\n📦 *xProdukt:* __' + prod + '__\n🔢 *xIlosc:* __' + ile + '__\n💵 *xKwota:* __' + kasa + ' PLN__\n💳 *xMetoda platnosci:* __' + met + '__\n\n🛒 *xKupujacy*\n<@' + odbiorca + '>\n\n🛍️ *xSprzedajacy*\n<@' + config.SELLER_USER_ID + '>')
            .setFooter({ text: config.SHOP_NAME });
        await kanal.send({ embeds: [embed] });
        await interaction.reply({ content: 'Wyslano!', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
