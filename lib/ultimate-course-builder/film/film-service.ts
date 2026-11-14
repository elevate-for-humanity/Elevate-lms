import type {UltimateLessonFilmPlan} from './lesson-film-composer';import type {UltimateFilmRenderer,UltimateRenderedFilm} from './render-contract';
export class UltimateFilmService{constructor(private renderer:UltimateFilmRenderer){}async render(plan:UltimateLessonFilmPlan):Promise<UltimateRenderedFilm>{return this.renderer.render(plan);}}
