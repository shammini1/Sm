const fs = require("fs-extra");
const moment = require("moment-timezone");
const { createCanvas, loadImage, registerFont } = require("canvas");

// ----------------------------
// PURPLE COSMIC FONT SETUP
// ----------------------------
let fontFamily = "Arial Black"; // default system font

try {
  const fontPath = "./fonts/PurpleCosmic.ttf"; // এখানে তোমার Purple Cosmic ফন্ট path
  if (fs.existsSync(fontPath)) {
    registerFont(fontPath, { family: "Purple Cosmic" });
    fontFamily = "Purple Cosmic";
    console.log("Purple Cosmic font loaded successfully!");
  } else {
    console.warn("Purple Cosmic font not found, using system font Arial Black");
  }
} catch (err) {
  console.warn("Font registration failed, using system font Arial Black");
}

const botStartTime = Date.now();

module.exports = {
  config: {
    name: "prefix",
    version: "3.4",
    author: "গরিবের বটের ফাইলে আবার Author? ডিরিম ভাই ডিরিম।🥹",
    role: 0,
    description: "Show bot prefix info on professional neon image with Purple Cosmic font",
    category: "⚙ Configuration"
  },

  onStart: async function({ message }) {
    return;
  },

  onChat: async function({ event, message, threadsData }) {
    const text = (event.body || event.message?.body || "").trim();
    if (!text || text.toLowerCase() !== "prefix") return;

    const globalPrefix = global.GoatBot.config.prefix;
    const threadPrefix = await threadsData.get(event.threadID, "data.prefix") || globalPrefix;

    const currentTime = moment().tz("Asia/Dhaka").format("hh:mm A");
    const uptimeMs = Date.now() - botStartTime;
    const sec = Math.floor(uptimeMs / 1000) % 60;
    const min = Math.floor(uptimeMs / (1000 * 60)) % 60;
    const hr = Math.floor(uptimeMs / (1000 * 60 * 60)) % 24;
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const uptime = `${days}d ${hr}h ${min}m ${sec}s`;

    const width = 1200;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // ----------------------------
    // BACKGROUND: Image or Gradient
    // ----------------------------
    try {
      const bg = await loadImage("background.jpg");
      ctx.drawImage(bg, 0, 0, width, height);
    } catch (err) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f0c29");
      gradient.addColorStop(0.5, "#302b63");
      gradient.addColorStop(1, "#24243e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // ----------------------------
    // LIGHT FLARE EFFECT
    // ----------------------------
    function drawLightFlare(x, y, radius, color) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.4, color + "44");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    drawLightFlare(300, 150, 200, "#ff00ff");
    drawLightFlare(900, 450, 250, "#00ffff");

    // ----------------------------
    // NEON BORDER
    // ----------------------------
    ctx.lineWidth = 15;
    ctx.strokeStyle = "rgba(255,0,0,0.8)";
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 40;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    ctx.shadowBlur = 0;

    // ----------------------------
    // NEON TEXT with Purple Cosmic
    // ----------------------------
    const paddingLeft = 60;
    const textSize = 60;
    const colors = ["#ff0055", "#ff6600", "#ffcc00", "#33ffcc", "#3399ff", "#cc33ff"];

    function drawNeonText(text, y, color) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 35;
      ctx.fillStyle = color;
      ctx.font = `${textSize}px "${fontFamily}"`;
      ctx.fillText(text, paddingLeft, y);
      ctx.shadowBlur = 0;
    }

    const lines = [
      { text: `🌍 Global: ${globalPrefix}`, color: colors[0] },
      { text: `💬 Chat: ${threadPrefix}`, color: colors[1] },
      { text: `📘 Help: ${threadPrefix}help`, color: colors[2] },
      { text: `⏰ Time: ${currentTime}`, color: colors[3] },
      { text: `⏳ Uptime: ${uptime}`, color: colors[4] },
      { text: `👤 Your ID: ${event.senderID}`, color: colors[5] },
      { text: ` ✍ Dev: MƛƦƲƑ`, color: colors[0] },
    ];

    lines.forEach((line, index) => {
      drawNeonText(line.text, 80 + index * 70, line.color);
    });

    // ----------------------------
    // SAVE & SEND IMAGE
    // ----------------------------
    const outputPath = `/tmp/prefix_${event.threadID}.png`;
    fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));

    return message.reply({
      body: "✔𝙷𝚎𝚛𝚎 𝚒𝚜 𝚖𝚢 𝙿𝚛𝚎𝚏𝚒𝚡 𝚒𝚗𝚏𝚘:",
      attachment: fs.createReadStream(outputPath)
    });
  }
};
