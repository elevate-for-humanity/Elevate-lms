import { compatibleVisualTask } from '../instructional/reviewed-scene-evidence';
type Requirement = {id: string; description: string; sourceLabel?: string};
type Supplied = {id: string; description: string; authorityRequirementIds: string[]};
const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** Stable source references identify requirements; wording and array order do not. */
export function coversRegisteredCompetencies(required: Requirement[], supplied: Supplied[], rapidsCode: string) {
  const refs = (item: Requirement) => [item.id, `RAPIDS:${rapidsCode}:APPENDIX_A:${item.sourceLabel ?? item.id}`];
  const allowed = new Set(required.flatMap(refs));
  if (supplied.some(item => !item.authorityRequirementIds?.length || item.authorityRequirementIds.some(ref => !allowed.has(ref)))) return false;
  return required.every(item => supplied.some(actual =>
    actual.authorityRequirementIds.some(ref => refs(item).includes(ref)) &&
    (normalized(actual.description) === normalized(item.description) ||
      Boolean(compatibleVisualTask(item.description, actual.description) &&
        compatibleVisualTask(actual.description, item.description)))
  ));
}
