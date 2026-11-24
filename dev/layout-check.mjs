// Developer check for the bouquet layout: how much the flowers had to shrink, and how much any two still overlap.
//   node dev/layout-check.mjs
import { planLayout, placeNew, COLLIDE } from '../src/pages/bloom/layout3d.js';
import { START_FLOWERS, MAX_FLOWERS, specAt, hydrangeaSlots } from '../src/pages/bloom/plan3d.js';

const specs = Array.from({ length: START_FLOWERS }, (_, i) => specAt(i));
const items = specs.map((s) => ({ reach: s.reach })).concat(hydrangeaSlots().map((p) => ({ reach: 0.3, fixed: p })));
const plan = planLayout(items);
console.log(`start: ${START_FLOWERS} flowers + 3 hydrangea, shrink to ${(plan.scale * 100).toFixed(0)}%, worst overlap ${(plan.overlap * 100).toFixed(1)}% of touching distance`);

const placed = plan.positions.map((p, i) => ({ p, r: plan.radii[i] }));
let worst = 0;
for (let i = START_FLOWERS; i < MAX_FLOWERS; i++) {
  const s = specAt(i);
  const spot = placeNew(placed, s.reach * plan.scale);
  worst = Math.min(worst, spot.clearance);
  placed.push({ p: spot.p, r: spot.r });
}
console.log(`adding up to ${MAX_FLOWERS}: tightest clearance ${worst.toFixed(3)} (negative means a small overlap)`);
if (plan.overlap > 0.1) { console.error('The layout still overlaps too much.'); process.exit(1); }
