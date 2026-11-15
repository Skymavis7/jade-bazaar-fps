// The look plan, in one place: a night market in an old-town quarter. Six neutrals,
// one accent hue, and the two team colours. The same names are the CSS custom
// properties in index.html. Nothing else in the code names a colour literal.
export const PALETTE = {
  canvas: '#0b0e1a', // indigo night sky / fog
  surface: '#1a1f2e', // dark timber and slate
  hairline: '#2e3a4f', // painted wood trim
  ink: '#f2ead8', // warm paper white
  muted: '#8b93a7', // mist grey-blue
  accent: '#ff5a3c', // lantern red-orange (Ember Foxes, the attackers)
  teamB: '#3ddc97', // jade green (Jade Guard, the defenders)
  danger: '#e5484d', // damage red
  awningRed: '#c23b2e', // striped stall awning
  teal: '#2e7f74', // painted stall timber
  ochre: '#b98a2f', // faded gold cloth
  ground: '#20242e', // wet cobblestone
  lamp: '#ffb84d', // paper lantern glow
};

export function shade(name) {
  return PALETTE[name];
}
