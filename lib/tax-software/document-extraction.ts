import {extractTextFromImage} from '@/lib/ocr/tesseract-ocr';
const clean=(s:string)=>s.replace(/\s+/g,' ').trim();
const amount=(s:string,re:RegExp)=>{const m=s.match(re);return m?.[1]?.replace(/,/g,'')??''};
export async function extractW2Data(buffer:Buffer){const o=await extractTextFromImage(buffer);const t=o.text;
 return {confidence:o.confidence,employerEin:(t.match(/(?:employer(?:'s)? identification number|ein)\s*[:#]?\s*([0-9]{2}-?[0-9]{7})/i)?.[1]??'').trim(),
 employerName:clean(t.match(/employer(?:'s)? name[^\n]*\n([^\n]+)/i)?.[1]??''),
 wages:amount(t,/(?:wages,? tips,? other compensation|box\s*1)\D{0,30}([0-9,]+(?:\.\d{2})?)/i),
 federalWithholding:amount(t,/(?:federal income tax withheld|box\s*2)\D{0,30}([0-9,]+(?:\.\d{2})?)/i),
 socialSecurityWages:amount(t,/(?:social security wages|box\s*3)\D{0,30}([0-9,]+(?:\.\d{2})?)/i),
 socialSecurityTax:amount(t,/(?:social security tax withheld|box\s*4)\D{0,30}([0-9,]+(?:\.\d{2})?)/i),
 medicareWages:amount(t,/(?:medicare wages and tips|box\s*5)\D{0,30}([0-9,]+(?:\.\d{2})?)/i),
 medicareTax:amount(t,/(?:medicare tax withheld|box\s*6)\D{0,30}([0-9,]+(?:\.\d{2})?)/i),
 stateCode:(t.match(/(?:state|box\s*15)\s+([A-Z]{2})\b/i)?.[1]??''),
 stateWages:amount(t,/(?:state wages,? tips,? etc\.?|box\s*16)\D{0,30}([0-9,]+(?:\.\d{2})?)/i),
 stateWithholding:amount(t,/(?:state income tax|box\s*17)\D{0,30}([0-9,]+(?:\.\d{2})?)/i),rawText:t};
}
export async function extract1099Data(buffer:Buffer){const o=await extractTextFromImage(buffer);const t=o.text;const type=t.match(/1099[-\s]?(NEC|MISC|INT|DIV|R|G)/i)?.[1]?.toUpperCase()??'';
 return {confidence:o.confidence,formType:type,payerName:clean(t.match(/payer(?:'s)? name[^\n]*\n([^\n]+)/i)?.[1]??''),payerEin:(t.match(/payer(?:'s)? (?:TIN|federal identification number)\s*[:#]?\s*([0-9]{2}-?[0-9]{7})/i)?.[1]??''),amount:amount(t,/(?:nonemployee compensation|interest income|ordinary dividends|rents|other income|gross distribution)\D{0,40}([0-9,]+(?:\.\d{2})?)/i),federalWithholding:amount(t,/federal income tax withheld\D{0,30}([0-9,]+(?:\.\d{2})?)/i),rawText:t};
}
export async function extractIDData(buffer:Buffer){const o=await extractTextFromImage(buffer);return {confidence:o.confidence,rawText:o.text};}
