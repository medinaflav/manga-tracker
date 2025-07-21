const express = require("express");
const router = express.Router();
const { getLatestChapters } = require("../services/mangamoinsService");

router.get("/latest", async (req, res) => {
  try {
    const chapters = await getLatestChapters();
    res.json(chapters);
  } catch (err) {
    console.error("Scraping failed:", err.message);
    res.status(500).json({ message: "Scraping failed" });
  }
});

module.exports = router;
