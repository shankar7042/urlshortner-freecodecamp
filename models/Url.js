const { Schema, model } = require("mongoose");

const UrlSchema = new Schema({
  original_url: String,
  short_url: Number,
});

module.exports = model("Url", UrlSchema);
