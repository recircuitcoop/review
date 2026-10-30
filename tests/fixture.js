import { mountReview } from '../src/review.js';
window.mountReview = mountReview;
// `?doc=sections` loads the heading/nested-list fixture; the default stays review.md.
const doc = new URLSearchParams(location.search).get('doc') === 'sections' ? 'sections' : 'review';
window.fixtureOptions = {
  document: { id: 'fixture.md', version: 'v1', markdown: await (await fetch(`/tests/fixtures/${doc}.md`)).text() },
  labels: [{ id: 'accept', name: 'Accept', direction: 'left' }, { id: 'reject', name: 'Reject', direction: 'right' }],
};
window.review = mountReview(document.querySelector('#fixture'), window.fixtureOptions);
