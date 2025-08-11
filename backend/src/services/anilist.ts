import axios from 'axios';

const API_URL = 'https://graphql.anilist.co';

export const getAniListInfo = async (title: string) => {
  const query = `
    query ($search: String) {
      Media(search: $search, type: MANGA) {
        id
        description(asHtml: false)
        genres
        staff(role: "Story") { nodes { name { full } } }
      }
    }
  `;
  const res = await axios.post(API_URL, { query, variables: { search: title } });
  const media = res.data.data.Media;
  return media
    ? {
        synopsis: media.description,
        genres: media.genres,
        authors: media.staff.nodes.map((n: any) => n.name.full)
      }
    : null;
};
