// Reports whether an element is on screen, so a canvas that has scrolled away can stop drawing.
export function watchVisible(el, margin = '120px') {
  let visible = true;
  if (!('IntersectionObserver' in window)) return () => true;
  const io = new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; }, { rootMargin: margin });
  io.observe(el);
  return () => visible;
}
