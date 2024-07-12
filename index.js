const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ztoken = process.env['TOKEN']

// Your Discord bot token
const token = ztoken;

// File path to store banned users
const bannedUsersFilePath = path.resolve(__dirname, 'bannedUsers.json');

// Initialize bannedUsers as a Set
let bannedUsers = new Set();

// Load banned users from file if it exists
if (fs.existsSync(bannedUsersFilePath)) {
    const data = fs.readFileSync(bannedUsersFilePath, 'utf-8');
    try {
        const parsedData = JSON.parse(data);
        bannedUsers = new Set(parsedData);
    } catch (error) {
        console.error('Error parsing banned users data:', error);
    }
}

// Create a new Discord client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Global ban command
client.on('messageCreate', async message => {
    if (message.content.startsWith('!globalban')) {
        if (!message.member.permissions.has('BAN_MEMBERS')) return message.reply('You do not have permission to ban members.');
        const args = message.content.split(' ').slice(1);
        const userId = args[0];

        if (!userId) return message.reply('Please provide a user ID.');

        try {
            const user = await client.users.fetch(userId);
            if (!user) return message.reply('User not found.');

            bannedUsers.add(userId);
            fs.writeFileSync(bannedUsersFilePath, JSON.stringify([...bannedUsers]));

            for (const guild of client.guilds.cache.values()) {
                const member = guild.members.cache.get(userId);
                if (member) {
                    await member.ban({ reason: 'Globally banned' });
                }
            }

            message.reply(`User ${user.tag} has been globally banned.`);
        } catch (error) {
            console.error('Error fetching user:', error);
            message.reply('There was an error fetching the user.');
        }
    }
});

// Prevent rejoining for banned users
client.on('guildMemberAdd', member => {
    if (bannedUsers.has(member.id)) {
        member.ban({ reason: 'Globally banned' })
            .then(() => console.log(`Banned ${member.user.tag} from ${member.guild.name}`))
            .catch(console.error);
    }
});

// Login to Discord with your bot's token
client.login(token);
