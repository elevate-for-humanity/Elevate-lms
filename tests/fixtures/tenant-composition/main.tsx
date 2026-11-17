import React from 'react';
import { createRoot } from 'react-dom/client';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { TenantPreviewProvider } from '@/components/tenant/TenantPreviewContext';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import 'fixture-styles';
const query=new URLSearchParams(location.search);
const config=buildDefaultSiteConfig({organizationName:'Customer studio'});
config.homepage.announcement='';
config.branding.primaryColor='#19372b';
if(new URLSearchParams(location.search).has('legacy'))config.template.id='legacy83-premium';
config.footer.showContactDetails=!query.has('withoutBackdrop');
if(config.template.id==='legacy83-premium')config.footer.linkGroups=[{label:'Company',pageIds:['home']}];
config.contact={email:'fixture-owner-with-a-long-address@example.test',phone:'+1 (555) 123-4567',address:'An owner supplied address\nSuite 7',hours:['Monday by appointment']};
config.pages=[{id:'home',slug:'/',title:'Home',sections:[{id:'hero',type:'hero',settings:{introductionPlacement:'before-hero',backdropPosition:query.get('position') || 'right',backdropOpacity:12,imageFit:'contain',imageFrame:'plain',imageAspectRatio:'2/3'},content:{backdropImage:query.has('withoutBackdrop')?'':'/graphic.svg',image:'/portrait.svg',imageAlt:'Fixture portrait',title:'A customer headline',narration:'An approved customer introduction.',introductionTitle:'A customer-authored introduction heading that can wrap on small screens',audioUrl:'/audio/fixture.mp3',musicUrl:'/audio/music.mp3'}}]}];
createRoot(document.getElementById('root')!).render(<TenantPreviewProvider websiteId="fixture" readOnly><PublicTenantComposableSite site={{id:'fixture',subdomain:'fixture',siteName:'Customer studio',organizationId:null,config}}/></TenantPreviewProvider>);

