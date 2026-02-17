import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProgramInquiryRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/inquiry?program=${slug}`);
}
