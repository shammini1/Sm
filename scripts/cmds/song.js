const a = require("node-fetch");
const b = require("axios");
const c = require("fs");
const d = require("path");
const e = require("yt-search");

module.exports = {
  config: {
    name: "song",
    aliases: ["son", "song"],
    version: "0.0.7",
    author: "ArYAN",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Play music from YouTube" },
    longDescription: { en: "Search and download songs from YouTube" },
    category: "MUSIC",
    guide: { en: "/music song name" }
  },

  langs: {
    en: {
      wait: "🎵 Please wait...",
      noResult: "❌ No results found for your search query.",
      success: "🎵 MUSIC\n━━━━━━━━━━━━━━━\n\n%1",
      fail: "❌ Failed to download song: %1"
    }
  },

  onStart: async function ({ api, event, args, getLang }) {
    const f = args.join(" ");
    const g = await api.sendMessage(getLang("wait"), event.threadID, null, event.messageID);
    try {
      const h = await e(f);
      if (!h || !h.videos.length) throw new Error(getLang("noResult"));
      const i = h.videos[0];
      const j = `https://youtu.be/${i.videoId}`;
      const k = `https://apis-toop.vercel.app/aryan/yt?id=${j}&type=audio`;

      api.setMessageReaction("⌛", event.messageID, () => {}, true);

      const l = await b.get(k);
      let downloadUrl = l?.data?.downloadUrl;
      let title = l?.data?.title;

      if (!downloadUrl || !title) {
        throw new Error("API did not return a valid download link.");
      }

      if (!downloadUrl.startsWith("http")) {
        downloadUrl = `https://apis-toop.vercel.app${downloadUrl}`;
      }

      const m = await a(downloadUrl);
      if (!m.ok) throw new Error(`HTTP ${m.status}`);

      // Title cleanup
      title = title.replace(/[<>:"/\\|?*]/g, "").slice(0, 80);
      const n = `${title}.mp3`;
      const o = d.join(__dirname, n);
      const p = await m.buffer();

      c.writeFileSync(o, p);
      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await api.sendMessage(
        { attachment: c.createReadStream(o), body: getLang("success", title) },
        event.threadID,
        () => {
          c.unlinkSync(o);
          api.unsendMessage(g.messageID);
        },
        event.messageID
      );
    } catch (q) {
      console.error(`Error: ${q.message}`);
      api.sendMessage(getLang("fail", q.message), event.threadID, event.messageID);
    }
  }
};
