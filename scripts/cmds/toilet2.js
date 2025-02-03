module.exports = {
 config: {
   name: "toilet",
   aliases: ["toilet"],
   version: "1.0",
   author: "Upen Basnet",
   countDown: 5,
   role: 0,
   shortDescription: "face on toilet",
   longDescription: "",
   category: "fun",
   guide: "{pn}"
 },

 onStart: async function ({ message, event, args }) {
   let uid;

   // যদি কেউ কোনো মেসেজে reply করে কমান্ড দেয়
   if (event.type == "message_reply") {
     uid = event.messageReply.senderID; // রিপ্লাই করা মেসেজের প্রেরকের আইডি
   } 
   // যদি কেউ কাউকে মেনশন করে
   else {
     const mention = Object.keys(event.mentions);
     if (mention.length == 0) return message.reply("Please mention someone or reply to a message.");
     uid = mention[0]; // প্রথম মেনশনকৃত ব্যক্তির UID
   }

   // ইমেজ প্রসেসিং ফাংশন কল করা
   bal(uid).then(ptth => {
     message.reply({ body: "You Deserve This Place🤣", attachment: fs.createReadStream(ptth) });
   });
 }
};

async function bal(one, two) {
 try {
   let avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
   avone.circle();

   let avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
   avtwo.circle();

   let pth = "toilet.png";
   let img = await jimp.read("https://i.imgur.com/sZW2vlz.png");

   img.resize(1080, 1350)
      .composite(avone.resize(360, 360), 500, 200) // সঠিক পজিশনে বসানো
      .composite(avtwo.resize(450, 450), 300, 660);

   await img.writeAsync(pth);
   return pth;
 } catch (err) {
   console.error("Error processing image:", err);
   return null;
 }
                              }
