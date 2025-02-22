const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const PORT = 3000;

app.get("/img", async (req, res) => {
  const prompt = req.query.prompt;
  const model = req.query.model;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  res.setHeader("Content-Type", "image/png"); // স্ট্রিমিং আউটপুট টেক্সট হিসেবে পাঠানো

  try {
    const form = new FormData();
    form.append('prompt', `${prompt}`);
    form.append("style", "${model}");
    form.append("aspect_ratio", "1:1");


    const response = await axios.post(
      "https://api.vyro.ai/v2/image/generations",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer vk-3tsIrXR52EVUtV3qFrVyRpBB0DKdd5K4QTgBkBucQVNa8u`,
        },
        responseType: "stream", // স্ট্রিমিং মোড অন করুন
      }
    );

    response.data.on("data", (chunk) => {
      res.write(chunk); // প্রতিটি অংশ আলাদাভাবে পাঠানো হবে
    });

    response.data.on("end", () => {
      res.write("\n🎉 Image generation complete!\n");
      res.end();
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.write(`\n❌ Image generation failed: ${error.message}\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`🔥 API is running on port ${PORT}`);
});
