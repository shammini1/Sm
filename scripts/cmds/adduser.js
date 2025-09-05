const { findUid } = global.utils;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// লিভ করা ইউজারদের ট্র্যাক করার জন্য
const leaveQueue = {};

module.exports = {
	config: {
		name: "adduser",
		aliases: ["add", "join"], // ✅ alias যোগ করা হলো
		version: "2.5",
		author: "Maruf",
		countDown: 5,
		role: 1,
		description: {
			en: "Add user(s) to your group or re-add members who left with !Add"
		},
		category: "box chat",
		guide: {
			en: "{pn} [profile link | uid]\nReply a message with {pn} to add that user\nIf someone leaves, reply !Add to bring them back"
		}
	},

	langs: {
		en: {
			alreadyInGroup: "Already in group",
			successAdd: "✅ Added %1 member(s) successfully",
			failedAdd: "❌ Failed to add %1 member(s)",
			approve: "⏳ %1 member(s) added to approval list",
			invalidLink: "⚠️ Invalid facebook link",
			cannotGetUid: "⚠️ Cannot fetch UID",
			linkNotExist: "⚠️ Profile link does not exist",
			cannotAddUser: "🚫 Bot blocked or user blocked stranger requests",
			askReAdd: "👋 %1 left the group. Reply with !Add to re-add."
		}
	},

	// ✅ কেউ গ্রুপ ছাড়লে ট্র্যাক হবে
	onEvent: async function ({ event, api, message, getLang }) {
		if (event.logMessageType === "log:unsubscribe") {
			const leftUser = event.logMessageData.leftParticipantFbId;
			leaveQueue[event.threadID] = leftUser;

			api.getUserInfo(leftUser, (err, data) => {
				if (err || !data[leftUser]) return;
				const name = data[leftUser].name || "User";
				message.reply(getLang("askReAdd", name));
			});
		}

		// ✅ কেউ "!Add" লিখলে, লিভ করা ইউজারকে ফেরত আনা হবে
		if (event.body && event.body.trim().toLowerCase() === "!add") {
			const uid = leaveQueue[event.threadID];
			if (!uid) return;

			try {
				await api.addUserToGroup(uid, event.threadID);
				await message.reply("✅ ইউজারকে আবার এড করা হয়েছে!");
				delete leaveQueue[event.threadID];
			} catch {
				await message.reply("❌ এড করতে সমস্যা হয়েছে!");
			}
		}
	},

	// ✅ কমান্ড কাজ করবে, আর রিপ্লাই করলে রিপ্লাইড ইউজারকে এড করবে
	onStart: async function ({ message, api, event, args, threadsData, getLang }) {
		const { members, adminIDs, approvalMode } = await threadsData.get(event.threadID);
		const botID = api.getCurrentUserID();

		const success = { added: [], waitApproval: [] };
		const failed = [];

		const pushError = (type, item) => {
			failed.push({ type, uids: [item] });
		};

		// ✅ যদি রিপ্লাই করা মেসেজ থাকে
		if (event.type === "message_reply" && event.messageReply.senderID) {
			const uid = event.messageReply.senderID;

			if (members.some(m => m.userID == uid && m.inGroup)) {
				await message.reply(getLang("alreadyInGroup"));
				return;
			}
			try {
				await api.addUserToGroup(uid, event.threadID);
				await message.reply("✅ Reply করা ইউজারকে গ্রুপে এড করা হয়েছে!");
			} catch {
				await message.reply(getLang("cannotAddUser"));
			}
			return;
		}

		// ✅ আগের মত লিঙ্ক/UID থেকে এড করার সাপোর্ট
		const regExMatchFB = /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb|m\.facebook)\.(?:com|me)\/([\w\-\.]+)/i;

		for (const item of args) {
			let uid;
			let skip = false;

			if (isNaN(item) && regExMatchFB.test(item)) {
				for (let i = 0; i < 5; i++) {
					try {
						uid = await findUid(item);
						break;
					} catch (err) {
						if (["SlowDown", "CannotGetData"].includes(err.name)) {
							await sleep(1000);
							continue;
						}
						pushError(
							err.name === "InvalidLink" ? getLang("invalidLink") :
							err.name === "CannotGetData" ? getLang("cannotGetUid") :
							err.name === "LinkNotExist" ? getLang("linkNotExist") :
							err.message, item
						);
						skip = true;
						break;
					}
				}
			} 
			else if (!isNaN(item)) uid = item;
			else continue;

			if (skip) continue;

			if (members.some(m => m.userID == uid && m.inGroup)) {
				pushError(getLang("alreadyInGroup"), item);
				continue;
			}

			try {
				await api.addUserToGroup(uid, event.threadID);
				if (approvalMode && !adminIDs.includes(botID))
					success.waitApproval.push(uid);
				else
					success.added.push(uid);
			} catch {
				pushError(getLang("cannotAddUser"), item);
			}
		}

		let msg = "";
		if (success.added.length)
			msg += `${getLang("successAdd", success.added.length)}\n`;
		if (success.waitApproval.length)
			msg += `${getLang("approve", success.waitApproval.length)}\n`;
		if (failed.length)
			msg += `${getLang("failedAdd", failed.reduce((a, b) => a + b.uids.length, 0))}` +
				   failed.map(f => `\n   • ${f.uids.join(", ")} → ${f.type}`).join("");

		await message.reply(msg || "⚠️ No valid input provided!");
	}
};
