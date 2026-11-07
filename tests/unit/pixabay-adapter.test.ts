import {expect,it,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
import {searchPixabay} from '@/lib/media/pixabay';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it('requires real credentials before searching',async()=>{
 vi.stubEnv('PIXABAY_API_KEY','');await expect(searchPixabay('test')).rejects.toThrow('PIXABAY_API_KEY');
});
it('returns attributed provider results and caches the request for 24 hours',async()=>{
 vi.stubEnv('PIXABAY_API_KEY','test-only-key');
 const fetcher=vi.fn().mockResolvedValue(Response.json({totalHits:1,hits:[{id:1,largeImageURL:'https://cdn.pixabay.com/photo.jpg',previewURL:'https://cdn.pixabay.com/preview.jpg',tags:'classroom',user:'Contributor',pageURL:'https://pixabay.com/photos/example-1/',imageWidth:800,imageHeight:600}]}));
 vi.stubGlobal('fetch',fetcher);
 expect(await searchPixabay('unique test query',{orientation:'portrait'})).toMatchObject({total:1,source:'pixabay',items:[{sourceCredit:'Pixabay / Contributor',sourceUrl:'https://pixabay.com/photos/example-1/',usedCount:null}]});
 await searchPixabay('unique test query',{orientation:'portrait'});
 expect(fetcher).toHaveBeenCalledTimes(1);
 expect(fetcher.mock.calls[0][0]).toContain('orientation=vertical');
});
