const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["boxinfo"],
    version: "1.0",
    author: "Maruf 🍒",
    countDown: 0,
    role: 0,
    shortDescription: "See group info",
    longDescription: "Get full information about the group (admins, members, stats)",
    category: "box chat",
    guide: {
      en: "{p} [groupinfo|boxinfo]",
    }
  },

  onStart: async function ({ api, event }) {
    let threadInfo = await api.getThreadInfo(event.threadID);

    let threadMem = threadInfo.participantIDs.length;
    let gendernam = [];
    let gendernu = [];
    let nope = [];

    for (let z in threadInfo.userInfo) {
      let gioitinhone = threadInfo.userInfo[z].gender;
      let nName = threadInfo.userInfo[z].name;
      if (gioitinhone == "MALE") {
        gendernam.push(nName);
      } else if (gioitinhone == "FEMALE") {
        gendernu.push(nName);
      } else {
        nope.push(nName);
      }
    }

    let nam = gendernam.length;
    let nu = gendernu.length;

    let listad = '';
    let qtv2 = threadInfo.adminIDs;
    let qtv = threadInfo.adminIDs.length;
    let sl = threadInfo.messageCount;
    let icon = threadInfo.emoji;
    let threadName = threadInfo.threadName;
    let id = threadInfo.threadID;

    for (let i = 0; i < qtv2.length; i++) {
      const infu = (await api.getUserInfo(qtv2[i].id));
      const name = infu[qtv2[i].id].name;
      listad += `• ${name}\n`;
    }

    let sex = threadInfo.approvalMode;
    let pd = sex == false ? 'Turned off' : sex == true ? 'Turned on' : 'Unknown';

    let msg = {
      body: `🍒「 GC Name 」: ${threadName}\n🎀「 Group ID 」: ${id}\n🌷「 Approval 」: ${pd}\n💛「 Emoji 」: ${icon}\n🔥「 Information 」: Including ${threadMem} Members\n💌「 Males 」: ${nam}\n😘「 Females 」: ${nu}\n💝「 Admins 」: ${qtv}\n「 Admin List 」:\n${listad}\n🐰「 Messages 」: ${sl} msgs.\n\nMade with ❤️ By: Maruf`
    };

    // ✅ গ্রুপ প্রোফাইল পিক থাকলে ছবি পাঠাবে
    if (threadInfo.imageSrc) {
      let imgPath = __dirname + "/cache/1.png";
      request(encodeURI(threadInfo.imageSrc))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          msg.attachment = fs.createReadStream(imgPath);
          api.sendMessage(msg, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);
        });
    } else {
      // ✅ ছবি না থাকলে শুধু টেক্সট যাবে
      api.sendMessage(msg, event.threadID, event.messageID);
    }
  }
};
