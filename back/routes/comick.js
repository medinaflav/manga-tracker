const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get latest chapters from Comick
router.get('/latest', async (req, res) => {
  try {
    const resp = await axios.get('https://comick.io/api/latest', {
      params: { limit: 20 },
    });
    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ message: 'Comick request failed' });
  }
});

module.exports = router;
