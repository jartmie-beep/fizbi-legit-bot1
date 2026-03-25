
index.js:

require('dotenv').config();
var d = require('discord.js');
var c = require('./config');
var bot = new d.Client({intents:[d.GatewayIntentBits.Guilds,d.GatewayIntentBits.GuildMessages,d.GatewayIntentBits.GuildMembers]});

bot.once('ready', async function(){
console.log('Bot online');
var r = new d.REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
var cmd = new d.SlashCommandBuilder().setName('legitcheck').setDescription('LC').addUserOption(function(o){return o.setName('kupujacy').setDescription('kup').setRequired(true);});
await r.put(d.Routes.applicationCommands(bot.user.id),{body:[cmd.toJSON()]});
});

bot.on('interactionCreate', async function(i){
if(i.isChatInputCommand() && i.commandName==='legitcheck'){
var ok = i.member.roles.cache.some(function(r){return r.name===c.OWNER_ROLE_NAME;});
if(!ok) return i.reply({content:'Brak uprawnien',ephemeral:true});
if(i.channel.name.toLowerCase().indexOf('ticket')===-1) return i.reply({content:'Tylko ticket',ephemeral:true});
var b = i.options.getUser('kupujacy');
var m = new d.ModalBuilder().setCustomId('lc_'+b.id).setTitle('LC');
m.addComponents(
new d.ActionRowBuilder().addComponents(new d.TextInputBuilder().setCustomId('p').setLabel('Produkt').setStyle(d.TextInputStyle.Short).setRequired(true)),
new d.ActionRowBuilder().addComponents(new d.TextInputBuilder().setCustomId('i').setLabel('Ilosc').setStyle(d.TextInputStyle.Short).setRequired(true)),
new d.ActionRowBuilder().addComponents(new d.TextInputBuilder().setCustomId('k').setLabel('Kwota').setStyle(d.TextInputStyle.Short).setRequired(true)),
new d.ActionRowBuilder().addComponents(new d.TextInputBuilder().setCustomId('m').setLabel('Metoda').setStyle(d.TextInputStyle.Short).setRequired(true))
);
await i.showModal(m);
}
if(i.isModalSubmit() && i.customId.indexOf('lc_')===0){
var bid = i.customId.split('_')[1];
var ch = i.guild.channels.cache.find(function(x){return x.name.toLowerCase().indexOf('legit-check')!==-1;});
if(!ch) return i.reply({content:'Brak kanalu',ephemeral:true});
var pr = i.fields.getTextInputValue('p');
var il = i.fields.getTextInputValue('i');
var kw = i.fields.getTextInputValue('k');
var mt = i.fields.getTextInputValue('m');
var e = new d.EmbedBuilder()
.setTitle('✅ Robux SHOP™ x LEGIT CHECK')
.setColor(0x00FF00)
.setDescription('• 🛒 xInformacje o zamowieniu:\n\n📦 xProdukt: **'+pr+'**\n🔢 xIlosc: **'+il+'**\n💵 xKwota: **'+kw+' PLN**\n💳 xMetoda platnosci: **'+mt+'**')
.addFields({name:'🛒 xKupujacy',value:'<@'+bid+'>',inline:true},{name:'🛍️ xSprzedajacy',value:'<@'+c.SELLER_USER_ID+'>',inline:true})
.setImage('https://image2url.com/r2/default/images/1774449217451-e330583a-359f-41a2-b7e0-8300eab4e4b7.jpg')
.setFooter({text:'Robux SHOP'});
await ch.send({embeds:[e]});
await i.reply({content:'Wyslano!',ephemeral:true});
}
});

bot.login(process.env.DISCORD_TOKEN);
