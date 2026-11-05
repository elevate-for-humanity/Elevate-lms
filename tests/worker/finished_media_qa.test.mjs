import {isTransientCourseFailure,requestFirstFailureRepair} from '../../lib/ultimate-course-builder/worker/first-failure-repair.mjs';
test('MEDIA_SCENE_NARRATION_MISMATCH requires repair', () => {
    const failureMessage = 'MEDIA_SCENE_NARRATION_MISMATCH:scene:seg-09-independent-practice:0.741';
    assert.equal(isTransientCourseFailure([{message: failureMessage}]), false);
});