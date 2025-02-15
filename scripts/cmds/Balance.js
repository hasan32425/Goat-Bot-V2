module.exports = {
    config: {
        name: "paisa",
        aliases: ["baigan"],
        version: "1.5",
        author: "NTKhang",
        countDown: 5,
        role: 0,
        description: {
            en: "📊 | View your money or the money of the tagged person."
        },
        category: "economy",
        guide: {
            en: "   {pn}: view your money 💰"
                + "\n   {pn} <@tag>: view the money of the tagged person 💵"
                + "\n   {pn} send [amount] @mention: send money to someone 💸"
                + "\n   {pn} request [amount] @mention: request money from someone 💵"
        }
    },

    langs: {
        en: {
            money: "💰 | 𝑌𝑜𝑢𝑟 𝐵𝑎𝑙𝑎𝑛𝑐𝑒 𝑖𝑠: %1$ 🌟",
            moneyOf: "💳 | %1 𝐻𝑎𝑠: %2$ 🌟",
            sentMoney: "✅ | You successfully sent %1$ to %2!",
            receivedMoney: "✅ | You received %1$ from %2!",
            insufficientFunds: "❌ | You don't have enough money to send!",
            requestMoney: "📩 | %1 has requested %2$ from you! Use `{pn} send %2$ @%1` to send.",
            requestSent: "📩 | You requested %1$ from %2!"
        }
    },

    formatMoney: function (amount) {
        if (!amount) return "0";
        if (amount >= 1e12) return (amount / 1e12).toFixed(1) + 'T';
        if (amount >= 1e9) return (amount / 1e9).toFixed(1) + 'B';
        if (amount >= 1e6) return (amount / 1e6).toFixed(1) + 'M';
        if (amount >= 1e3) return (amount / 1e3).toFixed(1) + 'K';
        return amount.toString();
    },

    onStart: async function ({ message, usersData, event, getLang, args, api }) {
       let targetUserID = event.senderID; // Default to the command caller's ID

		// Check if the message is a reply
		if (event.messageReply) {
			targetUserID = event.messageReply.senderID;
		}

		// Check if the message mentions someone
		if (Object.keys(event.mentions).length > 0) {
			const uids = Object.keys(event.mentions);
			let msg = "📝 | 𝐇𝐞𝐫𝐞'𝐬 𝐘𝐨𝐮𝐫 𝐁𝐚𝐥𝐚𝐧𝐜𝐞 𝐈𝐧𝐟𝐨:\n\n";
			for (const uid of uids) {
				const userMoney = await usersData.get(uid, "money");

				// If no money found for the user, handle it
				const formattedMoney = this.formatMoney(userMoney || 0);
				msg += `💳 | ${event.mentions[uid].replace("@", "")}: ${formattedMoney} 💵\n`;
			}
			return message.reply(msg.trim() + "\n✨ | 𝐇𝐚𝐯𝐞 𝐚 𝐠𝐨𝐨𝐝 𝐝𝐚𝐲 !");
		}

		// Get money of the person who replied or the sender
		const userData = await usersData.get(targetUserID);

		// If userData is undefined or money is not defined, handle it
		const money = userData ? userData.money : 0;
		const formattedMoney = this.formatMoney(money);
		message.reply(getLang("money", formattedMoney) + " 🎉");
	};
        const command = args[0].toLowerCase();
        const amount = parseInt(args[1]);
        const { senderID, threadID, mentions, messageReply } = event;
        let targetID;

        if (command !== "send" && command !== "request") return;

        if (isNaN(amount) || amount <= 0) {
            return api.sendMessage(`❌ | Invalid amount! Usage:\n{pn} send [amount] @mention\n{pn} request [amount] @mention`, threadID);
        }

        if (messageReply) {
            targetID = messageReply.senderID;
        } else {
            const mentionKeys = Object.keys(mentions);
            if (mentionKeys.length === 0) {
                return api.sendMessage("❌ | Mention someone to send/request money!", threadID);
            }
            targetID = mentionKeys[0];
        }

        if (targetID === senderID) {
            return api.sendMessage("❌ | You cannot send/request money to yourself!", threadID);
        }

        if (command === "send") {
            const senderData = await usersData.get(senderID);
            const receiverData = await usersData.get(targetID);

            if (!senderData || !receiverData) {
                return api.sendMessage("❌ | User not found.", threadID);
            }

            if (senderData.money < amount) {
                return api.sendMessage(getLang("insufficientFunds"), threadID);
            }

            await usersData.set(senderID, { money: senderData.money - amount });
            await usersData.set(targetID, { money: receiverData.money + amount });

            const senderName = await usersData.getName(senderID);
            const receiverName = await usersData.getName(targetID);

            api.sendMessage(getLang("receivedMoney", this.formatMoney(amount), senderName), targetID);
            return api.sendMessage(getLang("sentMoney", this.formatMoney(amount), receiverName), threadID);
        }

        if (command === "request") {
            const requesterName = await usersData.getName(senderID);
            const targetName = await usersData.getName(targetID);

            api.sendMessage(getLang("requestMoney", requesterName, this.formatMoney(amount)), targetID);
            return api.sendMessage(getLang("requestSent", this.formatMoney(amount), targetName), threadID);
        }
    }
};
