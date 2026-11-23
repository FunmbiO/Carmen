// The four songs. Each has a Spotify track (or album, for a single) used for the in-page player and the link.
// To swap a song, change the id here. Ids are the last part of an open.spotify.com link.
export const SONGS = {
  bloom: { title: 'Like a Tattoo', by: 'Sade', note: 'quiet storm', kind: 'track', id: '4PEGwWH4tL6H7dGl4uVSPg' },
  bouquet: { title: 'Stranger', by: 'Jhené Aiko', note: 'dreamy, weightless', kind: 'track', id: '6lIF4MhtWaFVDJNhfd3hMv' },
  golden: { title: 'Solo', by: 'Future', note: 'the night settles in', kind: 'track', id: '4lH6nENd1y81jp7Yt9lTBX' },
  dark: { title: 'Whatever She Wants', by: 'Bryson Tiller', note: 'late night', kind: 'album', id: '60s0PMYFJhe34io9HuyUXf' },
};

export const spotifyUrl = (s) => `https://open.spotify.com/${s.kind}/${s.id}`;
export const embedUrl = (s) => `https://open.spotify.com/embed/${s.kind}/${s.id}?utm_source=generator&theme=0`;
