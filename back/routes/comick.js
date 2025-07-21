const express = require("express");
const router = express.Router();
const { getLatestChapters } = require("../services/comickService");

router.get("/latest", async (req, res) => {
  try {
    const chapters = await getLatestChapters();
    res.json(chapters);
  } catch {
    res.status(500).json({ message: "Comick request failed" });
  }
});

module.exports = router;
