export function canOwnerRecordService({userId,studentId,shop,members}) {
 if (!userId || userId===studentId || !shop?.active) return false;
 return shop.owner_id===userId || members.some(m=>m.partner_id===shop.partner_id && m.role==='owner' && m.status==='active');
}
export function validPracticalServiceDate(value,today=new Date().toISOString().slice(0,10)) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value) || value>today) return false;
 const parsed=new Date(value+'T00:00:00Z');
 return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===value;
}
