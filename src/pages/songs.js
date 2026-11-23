// The four songs. `yt` lists YouTube video ids to try in order (the first is the player; the rest are backups if a video
// blocks embedding). `kind`/`id` are the Spotify track (or album, for a single): the link, and the fallback player.
// To swap a song, change the ids here.
export const SONGS = {
  bloom: { title: 'Like a Tattoo', by: 'Sade', note: 'quiet storm', kind: 'track', id: '4PEGwWH4tL6H7dGl4uVSPg', yt: ['oP4sBeV7llE', 'Eg6fL6cAgT4', 'mVDQ-_PfFX8'] },
  bouquet: { title: 'Stranger', by: 'Jhené Aiko', note: 'dreamy, weightless', kind: 'track', id: '6lIF4MhtWaFVDJNhfd3hMv', yt: ['5rRjYt3iVfM', 'x9sq06NTSXU', 'jpt870c1UXY'] },
  golden: { title: 'Solo', by: 'Future', note: 'the night settles in', kind: 'track', id: '4lH6nENd1y81jp7Yt9lTBX', yt: ['X2DTROC4JCI', 'xC0pF72qmIw', '3QjSkB-ZJKQ'] },
  dark: { title: 'Whatever She Wants', by: 'Bryson Tiller', note: 'late night', kind: 'album', id: '60s0PMYFJhe34io9HuyUXf', yt: ['2MeftqZ_quo', 'ThEqGuYXl48', 'fTRiH8SQxKs'] },
};

export const spotifyUrl = (s) => `https://open.spotify.com/${s.kind}/${s.id}`;
export const embedUrl = (s) => `https://open.spotify.com/embed/${s.kind}/${s.id}?utm_source=generator&theme=0`;
