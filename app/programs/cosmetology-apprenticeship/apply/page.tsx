import { redirect } from 'next/navigation';

export default function CosmetologyApplyRedirect() {
  redirect('/apply?program=cosmetology-apprenticeship');
}
