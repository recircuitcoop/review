/** Fixed prototype thresholds: separate horizontal intent from selection/scrolling. */
export function swipeDirection(dx, dy) {
  if (Math.abs(dx) >= 60 && Math.abs(dx) >= 1.5 * Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return null;
}
