import { mountReview } from '../src/review.js';
const host = document.querySelector('#fixture');
const report = document.querySelector('#report');
let review, controller;
const results = [];
for (const scenario of ['left', 'right', 'short', 'vertical', 'cancel', 'escape', 'destroy']) {
  const button = document.createElement('button'); button.textContent = scenario;
  button.onclick = () => {
    controller?.abort(); controller = new AbortController();
    review?.destroy();
    review = mountReview(host, {
      document: { id: 'pointer.md', version: '1', markdown: 'One passage with enough words to wrap across lines and prove the whole selection moves together without changing the document layout. '.repeat(4) + '\n\n' + 'Scroll proof.\n\n'.repeat(35) },
      labels: [{ id: 'left', name: 'Accept', direction: 'left' }, { id: 'right', name: 'Reject', direction: 'right' }]
    });
    const surface = host.querySelector('.review-document');
    const p = surface.querySelector('p');
    let pending, moved = false, trusted = false, preview = false, stable = true, motionless = true, canceled = false;
    host.addEventListener('review:selection', event => { pending = event.detail; }, { signal: controller.signal });
    review.select(0, p.textContent.length);
    const before = p.getBoundingClientRect();
    surface.addEventListener('pointermove', event => {
      if (startX === undefined) return;
      moved = true; trusted ||= event.isTrusted;
      const ghost = host.querySelector('.review-swipe-preview');
      if (ghost && !ghost.hidden) {
        preview = ghost.textContent.includes(p.textContent) && ghost.textContent.includes(event.clientX < startX ? 'Accept' : 'Reject');
        const style = getComputedStyle(ghost);
        motionless &&= style.animationName === 'none' && style.transitionDuration.split(',').every(value => parseFloat(value) === 0);
      }
      const now = p.getBoundingClientRect(); stable &&= before.width === now.width && before.height === now.height;
      if (!canceled && ['cancel', 'escape', 'destroy'].includes(scenario)) {
        canceled = true;
        if (scenario === 'cancel') surface.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: event.pointerId }));
        if (scenario === 'escape') surface.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
        if (scenario === 'destroy') review.destroy();
      }
    });
    let startX;
    surface.addEventListener('pointerdown', event => { startX = event.clientX; trusted ||= event.isTrusted; });
    document.addEventListener('pointerup', () => {
      if (startX === undefined) return;
      startX = undefined;
      setTimeout(() => {
        const committed = scenario === 'destroy' ? [] : review.read();
        const expected = ['left', 'right'].includes(scenario);
        const correct = scenario === 'destroy' ? !host.children.length : committed.length === (expected ? 1 : 0) && (expected ? committed[0].labelId === scenario && committed[0].quote === p.textContent : pending?.quote === p.textContent);
        const pass = trusted && moved && stable && motionless && correct && (['left', 'right'].includes(scenario) ? preview : true) && !host.querySelector('.review-swipe-preview');
        results.push(`${pass ? 'PASS' : 'FAIL'} ${scenario}: trusted=${trusted} preview=${preview} stable=${stable} no-animation=${motionless} committed=${committed.length}${canceled ? ' (injected cancellation during trusted drag)' : ''}`);
        report.textContent = results.join('\n');
      }, 0);
    }, { signal: controller.signal });
    report.textContent = `${scenario}: drag from highlighted text. Horizontal >60px for left/right; <60px for short; mostly vertical for vertical. Cancellation signals are injected during trusted movement.\n${results.join('\n')}`;
  };
  document.querySelector('#scenarios').append(button);
}
window.addEventListener('scroll', () => { document.querySelector('#scroll').textContent = `Wheel/page scrolling observed: ${scrollY}px`; });
