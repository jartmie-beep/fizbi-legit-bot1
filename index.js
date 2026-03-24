require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder,
    REST,
    Routes
} = require('discord.js');
const config = require('./config');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ] 
});

const legitCheckCommand = new SlashCommandBuilder()
    .setName('legitcheck')
    .setDescription('Tworzy embed z informacjami o zamówieniu (tylko dla OWNER na kanałach ticketowych)')
    .addUserOption(option =>
        option.setName('kupujacy')
            .setDescription('Wybierz kupującego')
            .setRequired(true)
    );

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('Rejestrowanie slash commands...');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [legitCheckCommand.toJSON()] }
        );
        
        console.log('Slash commands zarejestrowane pomyślnie!');
    } catch (error) {
        console.error('Błąd podczas rejestrowania komend:', error);
    }
}

client.once('ready', async () => {
    console.log(`Bot zalogowany jako ${client.user.tag}`);
    await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === 'legitcheck') {
        const hasOwnerRole = interaction.member.roles.cache.some(
            role => role.name === config.OWNER_ROLE_NAME
        );
        
        if (!hasOwnerRole) {
            return interaction.reply({
                content: 'Nie masz uprawnień do tej komendy',
                ephemeral: true
            });
        }
        
        const channelName = interaction.channel.name.toLowerCase();
        if (!channelName.includes(config.TICKET_KEYWORD)) {
            return interaction.reply({
                content: 'Ta komenda jest dostępna tylko na kanałach ticketowych',
                ephemeral: true
            });
        }
        
        const buyer = interaction.options.getUser('kupujacy');
        
        const modal = new ModalBuilder()
            .setCustomId(`legitcheck_modal_${buyer.id}`)
            .setTitle('Legit Check - Informacje o zamówieniu');
        
        const produktInput = new TextInputBuilder()
            .setCustomId('produkt')
            .setLabel('Produkt')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('np. Robux 1000')
            .setRequired(true);
        
        const iloscInput = new TextInputBuilder()
            .setCustomId('ilosc')
            .setLabel('Ilość')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('np. 1')
            .setRequired(true);
        
        const kwotaInput = new TextInputBuilder()
            .setCustomId('kwota')
            .setLabel('Kwota (PLN)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('np. 50')
            .setRequired(true);
        
        const metodaInput = new TextInputBuilder()
            .setCustomId('metoda')
            .setLabel('Metoda płatności')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('np. BLIK, Przelew, PayPal')
            .setRequired(true);
        
        modal.addComponents(
            new ActionRowBuilder().addComponents(produktInput),
            new ActionRowBuilder().addComponents(iloscInput),
            new ActionRowBuilder().addComponents(kwotaInput),
            new ActionRowBuilder().addComponents(metodaInput)
        );
        
        await interaction.showModal(modal);
    }
    
    if (interaction.isModalSubmit() && interaction.customId.startsWith('legitcheck_modal_')) {
        const buyerId = interaction.customId.split('_')[2];
        
        const produkt = interaction.fields.getTextInputValue('produkt');
        const ilosc = interaction.fields.getTextInputValue('ilosc');
        const kwota = interaction.fields.getTextInputValue('kwota');
        const metoda = interaction.fields.getTextInputValue('metoda');
        
        // Znajdź kanał legit-check
        const legitCheckChannel = interaction.guild.channels.cache.find(
            channel => channel.name.toLowerCase() === config.LEGIT_CHECK_CHANNEL.toLowerCase()
        );
        
        if (!legitCheckChannel) {
            return interaction.reply({
                content: `Nie znaleziono kanału #${config.LEGIT_CHECK_CHANNEL}! Utwórz kanał o tej nazwie.`,
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`✅ ${config.SHOP_NAME}™ × LEGIT CHECK`)
            .setColor(config.EMBED_COLOR)
            .setDescription(
                `• 🛒 ×Informacje o zamówieniu:\n\n` +
                `📦 ×Produkt: **${produkt}**\n\n` +
                `🔢 ×Ilość: **${ilosc}**\n\n` +
                `💵 ×Kwota: **${kwota} PLN**\n\n` +
                `💳 ×Metoda płatności: **${metoda}**\n\n` +
                `ㅤ`
            )
            .addFields(
                { 
                    name: '🛒 ×Kupujący', 
                    value: `<@${buyerId}>`, 
                    inline: true 
                },
                { 
                    name: '🛍️ ×Sprzedający', 
                    value: `<@${config.SELLER_USER_ID}>`, 
                    inline: true 
                }
            )
            .setFooter({ text: config.SHOP_NAME });
        
        if (config.LOGO_URL && config.LOGO_URL.trim() !== '') {
            embed.setImage(config.LOGO_URL);
        }
        
        // Wyślij embed na kanał legit-check
        await legitCheckChannel.send({ embeds: [embed] });
        
        // Potwierdź użytkownikowi
        await interaction.reply({
            content: `✅ Legit check wysłany na kanał #${config.LEGIT_CHECK_CHANNEL}!`,
            ephemeral: true
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
