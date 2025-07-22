const express = require("express");
const router = express.Router();
const { getLatestChapters, getChaptersBySlug } = require("../services/comickService");

router.get("/latest", async (req, res) => {
  try {
    const chapters = await getLatestChapters();
    res.json(chapters);
  } catch {
    res.status(500).json({ message: "Comick request failed" });
  }
});

// Endpoint pour récupérer les chapitres d'un manga par son slug
router.get("/chapters/:slug", async (req, res) => {
  try {
    const chapters = await getChaptersBySlug(req.params.slug);
    res.json(chapters);
  } catch {
    res.status(500).json({ message: "Comick chapters request failed" });
  }
});

module.exports = router;
