import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import RepositoryLivePreview from '@/components/studio/RepositoryLivePreview';
afterEach(cleanup);
it('approved platform preview pages can run their controls and forms',()=>{
 render(<RepositoryLivePreview filePath={null} content="" initialUrl="https://admin.elevateforhumanity.org/studio/courses"/>);
 expect(screen.getByTitle('Deployed route preview').getAttribute('sandbox')).toContain('allow-scripts');
 expect(screen.getByTitle('Deployed route preview').getAttribute('sandbox')).toContain('allow-same-origin');
});
it('an unrelated website does not receive platform preview privileges',()=>{
 render(<RepositoryLivePreview filePath={null} content="" initialUrl="https://untrusted.example/"/>);
 expect(screen.getByTitle('Deployed route preview')).toHaveAttribute('sandbox','');
});
it('unsaved HTML remains isolated from the signed-in admin origin',()=>{
 render(<RepositoryLivePreview filePath="example.html" content="<h1>Draft</h1>"/>);
 expect(screen.getByTitle('Unsaved source preview').getAttribute('sandbox')).not.toContain('allow-same-origin');
});
