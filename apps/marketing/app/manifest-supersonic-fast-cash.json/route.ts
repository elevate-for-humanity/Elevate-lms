import { NextResponse } from 'next/server';

export function GET() {
 return NextResponse.json({
  id:'/pwa/supersonic-fast-cash',name:'Supersonic Fast Cash',short_name:'Fast Cash',
  description:'Tax preparation and tax training',start_url:'/tax',scope:'/',display:'standalone',
  background_color:'#082b66',theme_color:'#c8102e',
  icons:[{src:'/images/logo.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'/images/logo.png',sizes:'512x512',type:'image/png',purpose:'any'}]
 },{headers:{'Cache-Control':'public, max-age=300'}});
}
