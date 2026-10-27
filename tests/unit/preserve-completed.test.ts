import { expect, it } from "vitest";
import { preservedCourseCursor } from "../../lib/ultimate-course-builder/worker/preserve-completed.mjs";
const profile = {
  competencies: [{ id: "one" }, { id: "two" }, { id: "three" }],
  canonicalLessonIds: { one: "l1", two: "l2" },
};
const published = {
  id: "l1",
  status: "published",
  is_published: true,
  approved: true,
  video_status: "complete",
  media_quality_status: "approved",
  video_url: "saved.mp4",
  video_job_id: "job",
};
it("resumes at lesson three and removes obsolete repairs for finished lessons", () => {
  expect(
    preservedCourseCursor(
      profile,
      {
        nextCompetencyIndex: 0,
        repairCompetencyIds: ["one", "two"],
        unresolvedCompetencyIds: ["two"],
      },
      [published,{id:'l2',video_status:'complete',video_url:'/playback',media_attachment:{sourceLessonBuildId:'built-two'},film:{videoUrl:'film',captionsUrl:'captions',transcriptUrl:'transcript'}}],
      [{id:'built-two',competency_id:"two",status:"built",render_source:'film',captions_source:'captions',transcript_source:'transcript'}],
    ),
  ).toMatchObject({
    nextCompetencyIndex: 2,
    repairCompetencyIds: [],
    unresolvedCompetencyIds: [],
  });
});
it("does not skip unfinished or merely saved drafts", () => {
  expect(
    preservedCourseCursor(
      profile,
      {},
      [{ ...published, status: "draft" }],
      [{ competency_id: "two", status: "built_with_findings" }],
    ).nextCompetencyIndex,
  ).toBe(0);
});
it("honors an explicit repair instead of silently skipping it", () => {
  const payload = {
    nextCompetencyIndex: 0,
    checkpointRepair: { competencyId: "one", fromStep: "lesson_film_render" },
  };
  expect(preservedCourseCursor(profile, payload, [published], [])).toBe(
    payload,
  );
});


it("does not skip a built lesson whose canonical media handoff is missing or stale",()=>{
 const built={id:'built-two',competency_id:'two',status:'built',render_source:'new-film',captions_source:'captions',transcript_source:'transcript'};
 for(const film of [undefined,{videoUrl:'old-film',captionsUrl:'captions',transcriptUrl:'transcript'}]){
  const canonical={id:'l2',video_status:'complete',video_url:'/playback',media_attachment:{sourceLessonBuildId:'built-two'},film};
  expect(preservedCourseCursor(profile,{nextCompetencyIndex:1},[canonical],[built]).nextCompetencyIndex).toBe(1);
 }
});
