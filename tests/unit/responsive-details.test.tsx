import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {ResponsiveDetails} from '@/components/ui/ResponsiveDetails';
afterEach(cleanup);
describe('mobile program details',()=>{
  it('renders a native collapsed section before JavaScript, with the complete text available',()=>{
    const html=renderToString(<ResponsiveDetails title="Program steps"><p>Complete directions</p></ResponsiveDetails>);
    expect(html).toContain('<details');expect(html).not.toContain('open=""');
    expect(html).toContain('<summary');expect(html).toContain('Complete directions');
    expect(html).not.toContain(' hidden=');
  });
  it('retains the mobile native open state after a toggle',()=>{
    const {container}=render(<ResponsiveDetails title="Steps"><p>Directions</p></ResponsiveDetails>);
    const details=container.querySelector('details')!;
    expect(details.open).toBe(false);
    details.open=true;fireEvent(details,new Event('toggle'));
    expect(details.open).toBe(true);
  });
  it('shows full details on desktop',()=>{
    const original=window.matchMedia;
    window.matchMedia=vi.fn().mockReturnValue({matches:true,addEventListener(){},removeEventListener(){}});
    try{
      const {container}=render(<ResponsiveDetails title="Steps"><p>Directions</p></ResponsiveDetails>);
      expect(container.querySelector('details')?.open).toBe(true);
      expect(screen.getByText('Directions')).toBeInTheDocument();
    }finally{window.matchMedia=original;}
  });
});
