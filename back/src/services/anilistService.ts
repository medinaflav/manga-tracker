import axios from 'axios';

const BASE = process.env.ANILIST_BASE || 'https://graphql.anilist.co';

export const getMangaInfo = async (title: string) => {
  const query = `query ($search: String) { Media(search: $search, type: MANGA) { id description genres } }`;
  const { data } = await axios.post(BASE, { query, variables: { search: title } });
  return data;
};
