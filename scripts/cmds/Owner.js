const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
    config: {
        name: "owner",
        aliases:["own"],
        version: "1.0",
        author: "Hasan",
        countDown: 5,
        role: 2,
        category: "management",
        guide: {
            en: "   {pn} [add | -a] <uid | @tag>: Add owner role for a user\n" +
                "   {pn} [remove | -r] <uid | @tag>: Remove owner role from a user\n" +
                "   {pn} [add | -a] (reply): Add owner role for the user you replied to"
        }
    },

    langs: {
        en: {
            added: "✅ | Added owner role for %1 users:\n%2",
            alreadyAdmin: "\n⚠️ | %1 users already have owner role:\n%2",
            missingIdAdd: "⚠️ | Please provide an ID, tag a user, or reply to a message to add owner role",
            removed: "✅ | Removed owner role from %1 users:\n%2",
            notAdmin: "⚠️ | %1 users do not have owner role:\n%2",
            missingIdRemove: "⚠️ | Please provide an ID, tag a user, or reply to a message to remove owner role"
        }
    },

    onStart: async function ({ message, args, usersData, event, getLang }) {
        switch (args[0]) {
            case "add":
            case "-a": {
                let uids = [];

                // Check for mentioned users, replied message, or direct IDs
                if (Object.keys(event.mentions).length > 0) {
                    uids = Object.keys(event.mentions);
                } else if (event.messageReply) {
                    uids.push(event.messageReply.senderID);
                } else {
                    uids = args.filter(arg => !isNaN(arg));
                }

                if (uids.length === 0) {
                    return message.reply(getLang("missingIdAdd"));
                }

                const newAdmins = [];
                const alreadyAdmins = [];

                for (const uid of uids) {
                    if (config.ownerBot.includes(uid)) {
                        alreadyAdmins.push(uid);
                    } else {
                        newAdmins.push(uid);
                    }
                }

                config.ownerBot.push(...newAdmins);
                writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

                const newAdminNames = await Promise.all(newAdmins.map(uid => usersData.getName(uid)));
                const alreadyAdminNames = await Promise.all(alreadyAdmins.map(uid => usersData.getName(uid)));

                return message.reply(
                    (newAdmins.length > 0 ? 
                        getLang("added", newAdmins.length, newAdminNames.map(name => `• ${name}`).join("\n")) : "") +
                    (alreadyAdmins.length > 0 ? 
                        getLang("alreadyAdmin", alreadyAdmins.length, alreadyAdminNames.map(name => `• ${name}`).join("\n")) : "")
                );
            }

            case "remove":
            case "-r": {
                let uids = [];

                // Check for mentioned users, replied message, or direct IDs
                if (Object.keys(event.mentions).length > 0) {
                    uids = Object.keys(event.mentions);
                } else if (event.messageReply) {
                    uids.push(event.messageReply.senderID);
                } else {
                    uids = args.filter(arg => !isNaN(arg));
                }

                if (uids.length === 0) {
                    return message.reply(getLang("missingIdRemove"));
                }

                const removedAdmins = [];
                const notAdmins = [];

                for (const uid of uids) {
                    if (config.ownerBot.includes(uid)) {
                        removedAdmins.push(uid);
                        config.ownerBot.splice(config.ownerBot.indexOf(uid), 1);
                    } else {
                        notAdmins.push(uid);
                    }
                }

                writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

                const removedAdminNames = await Promise.all(removedAdmins.map(uid => usersData.getName(uid)));
                const notAdminNames = await Promise.all(notAdmins.map(uid => usersData.getName(uid)));

                return message.reply(
                    (removedAdmins.length > 0 ? 
                        getLang("removed", removedAdmins.length, removedAdminNames.map(name => `• ${name}`).join("\n")) : "") +
                    (notAdmins.length > 0 ? 
                        getLang("notAdmin", notAdmins.length, notAdminNames.map(name => `• ${name}`).join("\n")) : "")
                );
            }

            default: {
                return message.reply("⚠️ | Invalid command! Use 'add' or 'remove'.");
            }
        }
    }
};
