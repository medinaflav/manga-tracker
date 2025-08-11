import { isNewChapter } from '../jobs/releaseChecker';

test('isNewChapter detects newer chapter', () => {
  expect(isNewChapter(10, 11)).toBe(true);
  expect(isNewChapter(10, 10)).toBe(false);
});
