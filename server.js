const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const UrlModel = require("./models/Url");

const app = express();
require("dotenv").config();
// Basic Configuration
const port = process.env.PORT || 3000;

/** this project needs a db !! **/
// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

const dnsLookup = async (url) => {
  return new Promise((resolve, reject) => {
    dns.lookup(url, (err, address, family) => {
      if (err) reject(err);
      resolve({ address, family });
    });
  });
};

app.post("/api/shorturl/new", async (req, res) => {
  const { url } = req.body;
  try {
    if (url.startsWith("http")) {
      await dnsLookup(url.split("//")[1]);
    } else {
      await dnsLookup(url);
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

app.listen(port, function () {
  console.log(`Node.js listening on port ${port}`);
});
