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
				+ "\n   {pn} [reply]: view the money of the person you reply to 🏦"
		}
	},

	langs: {
		en: {
			money: "💰 | 𝑌𝑜𝑢𝑟 𝐵𝑎𝑙𝑎𝑛𝑐𝑒 𝑖𝑠: %1$ 🌟",
			moneyOf: "💳 | %1 𝐻𝑎𝑠: %2$ 🌟"
		}
	},

	// Helper function to format numbers into short form
	formatMoney: function (amount) {
		if (amount === undefined || amount === null) return "0"; // Handle case when money is undefined or null
		if (amount >= 1e12) return (amount / 1e12).toFixed(1) + 'T';
		if (amount >= 1e9) return (amount / 1e9).toFixed(1) + 'B';
		if (amount >= 1e6) return (amount / 1e6).toFixed(1) + 'M';
		if (amount >= 1e3) return (amount / 1e3).toFixed(1) + 'K';
		return amount.toString();
	},

	onStart: async function ({ message, usersData, event, getLang }) {
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
	}
};
onStart: async function ({ args, event, api, usersData }) {
    const hasan = args[0]?.toLowerCase();
    const amount = parseInt(args[1]); // পরিমাণ
    const { senderID, threadID, mentions, messageReply } = event;
    let targetID;

    if (!hasan || isNaN(amount) || amount <= 0) {
      return api.sendMessage(`Invalid command! Usage:\n{pn} send [amount] @mention\n{pn} request [amount] @mention\nor reply to a message with the command.`, threadID);
    }

    // যদি রিপ্লাই করা হয় তাহলে ওই ইউজারকে টার্গেট করা হবে
    if (event.type === "message_reply") {
        targetID = messageReply.senderID;
    } else {
        const mentionKeys = Object.keys(mentions);
        if (mentionKeys.length === 0) {
            return api.sendMessage("Invalid usage! Use: {pn} send [amount] @mention or reply to a message.", threadID);
        }
        targetID = mentionKeys[0];
    }

    if (hasan === 'send') {
        if (targetID === senderID) {
            return api.sendMessage("You cannot send money to yourself!", threadID);
        }

        const senderData = await usersData.get(senderID);
        const receiverData = await usersData.get(targetID);

        if (!senderData || !receiverData) {
            return api.sendMessage("User not found.", threadID);
        }

        if (senderData.money < amount) {
            return api.sendMessage("You don't have enough money to send.", threadID);
        }

        await usersData.set(senderID, {
            money: senderData.money - amount,
            exp: senderData.exp,
            data: senderData.data
        });

        await usersData.set(targetID, {
            money: receiverData.money + amount,
            exp: receiverData.exp,
            data: receiverData.data
        });

        const senderName = await usersData.getName(senderID);
        const receiverName = await usersData.getName(targetID);

        return api.sendMessage(`Successfully sent ${amount} coins to ${receiverName}.`, threadID);
    }

    if (hasan === 'request') {
        if (targetID === senderID) {
            return api.sendMessage("You cannot request money from yourself!", threadID);
        }

        const requesterName = await usersData.getName(senderID);
        const targetName = await usersData.getName(targetID);

        api.sendMessage(
            `${targetName}, you have received a request from ${requesterName} for ${amount} coins.\n\nTo send money, use:\n{pn} send ${amount} @${requesterName}`,
            threadID
        );

        return api.sendMessage(`You have requested ${amount} coins from ${targetName}.`, threadID);
    }
  }
};
