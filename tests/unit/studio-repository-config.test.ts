import {expect,it} from 'vitest';
import {studioRepository} from '@/lib/devstudio/repository';
it('resolves the retired owner spelling to the same repository as the container and PARIS',()=>{
 expect(studioRepository('elevateforhumanity/Elevate-lms')).toBe('elevate-for-humanity/Elevate-lms');
 expect(studioRepository('')).toBe('elevate-for-humanity/Elevate-lms');
 expect(studioRepository('another/project')).toBe('another/project');
});
