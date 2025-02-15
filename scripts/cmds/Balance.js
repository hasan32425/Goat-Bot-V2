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
        let targetUserID = event.senderID;

        if (event.messageReply) {
            targetUserID = event.messageReply.senderID;
        } 
        else if (event.mentions && Object.keys(event.mentions).length > 0) {
            let mentionedUsers = Object.keys(event.mentions);
            targetUserID = mentionedUsers[0]; // প্রথম মেনশন করা ইউজারকে ধরবে
        }

        const userData = await usersData.get(targetUserID);
        const money = userData?.money || 0;
        
        if (!args[0]) {
            return message.reply(`💰 তোমার বর্তমান ব্যালেন্স: ${money} টকা! 🤑`);
        } 
        else if (args[0].toLowerCase() === "send" || args[0].toLowerCase() === "request") {
            return this.handleTransaction({ message, usersData, event, getLang, args, api });
        } 
        else {
            return message.reply(`👀 ${userData?.name || "ব্যবহারকারী"}-এর ব্যালেন্স: ${money} টকা! 💸`);
        }
    },

    handleTransaction: async function ({ message, usersData, event, getLang, args, api }) {
        const command = args[0].toLowerCase();
        const amount = parseInt(args[1]);
        const { senderID, threadID, mentions, messageReply } = event;
        let targetID;

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

            await usersData.set(senderID, { ...senderData, money: senderData.money - amount });
            await usersData.set(targetID, { ...receiverData, money: receiverData.money + amount });

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
