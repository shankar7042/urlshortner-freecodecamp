const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UrlModel = require("./models/Url");

const app = express();
// Basic Configuration
const port = process.env.PORT || 3000;

/** this project needs a db !! **/
// mongoose.connect(process.env.DB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api/shorturl/:url_num", async (req, res) => {
  const { url_num } = req.params;
  try {
    const url_data = await UrlModel.findOne({ short_url: url_num });
    if (!url_data) {
      return res.json({ error: "invalid URL" });
    }
    if (url_data.original_url.startsWith("http")) {
      return res.redirect(url_data.original_url);
    } else {
      return res.redirect(`http://${url_data.original_url}`);
    }
  } catch (error) {
    console.log(error);
  }
});

const validateUrl = (url) => {
  const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
  return regex.test(url);
};

app.post("/api/shorturl/new", async (req, res) => {
  const { url } = req.body;
  try {
    if (!validateUrl(url)) {
      return res.json({ error: "invalid URL" });
    }
    const url_data = await UrlModel.findOne({ original_url: url });
    if (url_data) {
      return res.json({
        original_url: url_data.original_url,
        short_url: url_data.short_url,
      });
    }
    const length = await UrlModel.find().count().exec();

    const new_url_data = new UrlModel({
      original_url: url,
      short_url: length + 1,
    });

    await new_url_data.save();
    return res.json({
      original_url: new_url_data.original_url,
      short_url: new_url_data.short_url,
    });
  } catch (error) {
    console.log(error);
    return res.json({ error: "invalid URL" });
  }
});

app.listen(port, () => {
  console.log(`Node.js listening on port ${port}`);
  mongoose
    .connect(process.env.DB_URI || "mongodb://localhost/url-shortner", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));
});
