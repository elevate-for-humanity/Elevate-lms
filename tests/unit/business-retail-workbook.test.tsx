import {fireEvent,render,screen,waitFor,cleanup} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
vi.mock('@/components/lms/WorkbookNarration',()=>({default:()=>null}));
import BusinessRetailWorkbookLab from '@/components/lms/BusinessRetailWorkbookLab';
afterEach(cleanup);
function completePricing(){
 fireEvent.click(screen.getByLabelText('Selling price, excluding tax'));
 fireEvent.change(screen.getByLabelText('Regular gross margin (%)'),{target:{value:'40'}});
 fireEvent.change(screen.getByLabelText('Discounted price before tax ($)'),{target:{value:'27'}});
 fireEvent.change(screen.getByLabelText('Receipt total including tax ($)'),{target:{value:'28.89'}});
 fireEvent.change(screen.getByLabelText('Explain your decision and show your working'),{target:{value:'I divided gross profit by selling price and added tax only after applying the discount.'}});
 fireEvent.click(screen.getByRole('button',{name:'Check this case'}));
}
describe('business and retail project lab',()=>{
 it('checks calculations, records an explained attempt and confirms only the server save',async()=>{
  const record=vi.fn().mockResolvedValue(true);
  render(<BusinessRetailWorkbookLab sectionNumber={13} readOnly={false} onRecord={record}/>);
  expect((screen.getByRole('button',{name:'Check this case'}) as HTMLButtonElement).disabled).toBe(true);
  completePricing();expect(screen.getByText('This case meets the self-check.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Add this attempt to Practice 3'}));
  await waitFor(()=>expect(screen.getByText('Attempt saved in Practice 3.')).toBeTruthy());
  expect(record).toHaveBeenCalledWith(expect.stringContaining('Receipt total including tax ($): 28.89'));
  expect(record).toHaveBeenCalledWith(expect.stringContaining('My reasoning: I divided'));
 });
 it('retains a wrong calculation as correction-needed and does not invent a successful save',async()=>{
  render(<BusinessRetailWorkbookLab sectionNumber={13} readOnly={false} onRecord={vi.fn().mockResolvedValue(false)}/>);
  completePricing();
  fireEvent.change(screen.getByLabelText('Regular gross margin (%)'),{target:{value:'66.67'}});
  fireEvent.click(screen.getByRole('button',{name:'Check this case'}));
  expect(screen.getByText('Review the feedback, correct your work and retry.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Add this attempt to Practice 3'}));
  await waitFor(()=>expect(screen.getByText(/Attempt could not be saved/)).toBeTruthy());
  expect(screen.queryByText('Attempt saved in Practice 3.')).toBeNull();
 });
 it('changes case inputs without awarding a pass or allowing preview writes',()=>{
  const record=vi.fn();render(<BusinessRetailWorkbookLab sectionNumber={13} readOnly onRecord={record}/>);
  completePricing();
  expect((screen.getByRole('button',{name:'Add this attempt to Practice 3'}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Practice case'),{target:{value:'1'}});
  expect((screen.getByLabelText('Discounted price before tax ($)') as HTMLInputElement).value).toBe('');
  expect(screen.queryByText('This case meets the self-check.')).toBeNull();expect(record).not.toHaveBeenCalled();
 });
});
