// Sky colours at four points of the day: gold, honey, sunset, night. Three stops each, top to horizon.
export const SKY = [
  { t: 0, c: [[166, 122, 44], [224, 168, 64], [255, 217, 138]] },
  { t: 0.3, c: [[107, 61, 31], [201, 105, 44], [245, 160, 74]] },
  { t: 0.6, c: [[31, 26, 34], [90, 47, 35], [184, 85, 42]] },
  { t: 1, c: [[7, 16, 11], [15, 28, 19], [36, 48, 20]] },
];

export const STAGES = [
  { max: 0.25, w: 'Gold.', l: 'The first thing I think of when I see you: you’re very classy and luxurious.' },
  { max: 0.5, w: 'Honey.', l: 'Sweet and worth savouring.' },
  { max: 0.75, w: 'Sunset.', l: 'You compete with golden hour when it comes to that beauty glow.' },
  { max: 1.01, w: 'Night.', l: 'Just like the stars at night, you shine with beauty.' },
];

export const SUN_CODE = `sun.<span class="f">set</span>(time);
<span class="k">if</span> (time &gt; <span class="n">0.75</span>) {
  <span class="f">stars</span>.<span class="f">appear</span>();
}`;
