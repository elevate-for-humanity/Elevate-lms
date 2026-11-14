import { expect, it, vi } from 'vitest';
import { resolveProgramHolderPhoto } from '@/lib/program-holder/profile-photo';
function fixture(rows: any[]) {
  const sign = vi.fn(async () => ({ data: { signedUrl: 'https://storage.example/private-photo?token=signed' }, error: null }));
  const filters: any[] = [];
  const query: any = { select: () => query, eq: (k: string,v: any) => { filters.push([k,v]);return query; }, order: async () => ({ data: rows, error: null }) };
  return { db: { from: () => query, storage: { from: (bucket: string) => { expect(bucket).toBe('documents');return { createSignedUrl: sign }; } } }, sign, filters };
}
it('shows the newest approved private upload ahead of a stale avatar URL', async () => {
  const f = fixture([{ file_url: 'program-holders/holder/profile_photo/photo.jpg', status: 'approved', storage_bucket: 'documents' }]);
  expect(await resolveProgramHolderPhoto(f.db, { id:'owner',avatar_url:'https://old.example/avatar' }, 'holder')).toContain('token=signed');
  expect(f.filters).toContainEqual(['user_id','owner']);expect(f.sign).toHaveBeenCalledWith('program-holders/holder/profile_photo/photo.jpg',3600);
});
it('never signs another holder photo, a rejected upload, or a traversal path', async () => {
  for (const row of [{ file_url:'program-holders/other/profile_photo/photo.jpg',status:'approved' },{ file_url:'program-holders/holder/profile_photo/photo.jpg',status:'pending' },{ file_url:'program-holders/holder/profile_photo/photo.jpg',status:'rejected',approved:true },{ file_url:'program-holders/holder/profile_photo/../photo.jpg',status:'approved' }]) {
    const f=fixture([row]);expect(await resolveProgramHolderPhoto(f.db,{id:'owner'},'holder')).toBeNull();expect(f.sign).not.toHaveBeenCalled();
  }
});
