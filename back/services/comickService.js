const axios = require("axios");

async function getLatestChapters() {
  const resp = await axios.get("https://comick.io/api/latest", {
    params: { limit: 20 },
  });
  return resp.data;
}

module.exports = { getLatestChapters };
