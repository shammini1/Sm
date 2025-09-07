const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "1.21",
    author: "Amit Er file ke arektuxdlam",
    countDown: 5,
    role: 0,
    shortDescription: { en: "View all commands in a modern style" },
    longDescription: { en: "View all commands compactly with emoji and role" },
    category: "info",
    guide: { en: "{pn} / help or help commandName" },
    priority: 1,
  },

  onStart: async function ({ message, args, event, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);

    const rawInput = args.join(" ").trim();

    // Full command list
    if (!rawInput) {
      const allCommands = Array.from(commands.keys())
        .map(cmdName => {
          const cmd = commands.get(cmdName);
          if (!cmd?.config || typeof cmd.onStart !== "function") return null;
          if (cmd.config.role > 1 && role < cmd.config.role) return null;
          return {
            name: cmd.config.name,
            role: cmd.config.role,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

      let msg = "🎏 MARUF HELP MENU\n\n";
      for (const cmd of allCommands) {
        msg += `🔹 ${cmd.name} ${roleEmoji(cmd.role)}\n`;
      }
      msg += `\n📌 TOTAL CMD: ${allCommands.length}\n📌 PREFIX: ${prefix}\n📌 OWNER: MARUF`;

      const sentMsg = await message.reply({ body: msg });
      setTimeout(() => message.unsend(sentMsg.messageID), 120000);
      return;
    }

    // Command detail
    const commandName = rawInput.toLowerCase();
    const command = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!command || !command?.config) {
      return message.reply(`❌ Command "${commandName}" খুঁজে পাওয়া যায়নি।\nTry: /help`);
    }

    const cfg = command.config;
    const usage = cfg.guide?.en?.replace(/{pn}/g, `${prefix}${cfg.name}`) || "No guide available.";

    let detailMsg = `🔹 ${cfg.name.toUpperCase()} ${roleEmoji(cfg.role)}\n`;
    detailMsg += `📝 Description: ${cfg.longDescription?.en || "No description"}\n`;
    detailMsg += `👑 Author: ${cfg.author || "Unknown"}\n`;
    detailMsg += `⚙ Guide: ${usage}`;

    const sentDetail = await message.reply({ body: detailMsg });
    setTimeout(() => message.unsend(sentDetail.messageID), 120000);
  },
};

// Role number to emoji
function roleEmoji(role) {
  switch (role) {
    case 0: return "🌐"; // Everyone
    case 1: return "🛡️"; // Group Admin
    case 2: return "🤖"; // Bot Admin
    case 3: return "👑"; // Super Admin
    default: return "❓";
  }
                         }
