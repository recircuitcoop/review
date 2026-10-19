import { mountReview } from '../src/review.js';
window.mountReview = mountReview;
window.fixtureOptions = {
  document: { id: 'fixture.md', version: 'v1', markdown: await (await fetch('/tests/fixtures/review.md')).text() },
  labels: [{ id: 'accept', name: 'Accept', direction: 'left' }, { id: 'reject', name: 'Reject', direction: 'right' }],
};
window.review = mountReview(document.querySelector('#fixture'), window.fixtureOptions);
