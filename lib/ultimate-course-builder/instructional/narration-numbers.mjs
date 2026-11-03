const small=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function integerWords(n) {
  if(n<20)return small[n];
  if(n<100)return tens[Math.floor(n/10)]+(n%10?' '+small[n%10]:'');
  for(const [value,label] of [[1e12,'trillion'],[1e9,'billion'],[1e6,'million'],[1000,'thousand'],[100,'hundred']])
    if(n>=value)return integerWords(Math.floor(n/value))+' '+label+(n%value?' '+integerWords(n%value):'');
}
/** Speak explicit quantities without changing the canonical written instruction.
 * Unsupported identifiers and oversized values retain the existing ASR path. */
export function narrationSpeechText(text) {
  return String(text).replaceAll('%',' percent ').replaceAll('×',' times ').replaceAll('÷',' divided by ').replaceAll('−',' minus ').replaceAll('=',' equals ').replaceAll('+',' plus ').replaceAll('/',' slash ').replace(/(?<![\w.])(-)?(\$)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?![\w]|\.\d)/g,
    (original,negative,currency,whole,fraction)=>{
      const n=Number(whole.replaceAll(',',''));
      if(!Number.isSafeInteger(n)||n>=1e15||fraction?.length>6)return original;
      let result=integerWords(n);
      if(currency) {
        if(fraction&&fraction.length>2)return original;
        result+=' '+(n===1?'dollar':'dollars');
        const cents=Number((fraction??'').padEnd(2,'0'));
        if(cents)result+=' and '+integerWords(cents)+' '+(cents===1?'cent':'cents');
      } else if(fraction) result+=' point '+[...fraction].map(digit=>small[Number(digit)]).join(' ');
      return (negative?'minus ':'')+result;
    });
}

/** Canonical value tokens let numeric writing match measured spoken numbers
 * without accepting a different amount through a partial phrase. */
export function narrationTokens(text, onToken = undefined) {
 const tokens=narrationSpeechText(text).toLowerCase().match(/[a-z0-9]+/g)??[];
 const values=new Map([...small.map((word,i)=>[word,i]),...tens.map((word,i)=>[word,i*10]).filter(([word])=>word)]);
 const scales={thousand:1000,million:1e6,billion:1e9,trillion:1e12};
 const result=[];
 for(let i=0;i<tokens.length;) {
  const start=i;
  if(!values.has(tokens[i])) {const token=tokens[i++];result.push(token);onToken?.(token,start,i);continue;}
  let total=0,group=values.get(tokens[i++]),lastScale=Infinity;
  if(group>=20&&values.get(tokens[i])>0&&values.get(tokens[i])<10)group+=values.get(tokens[i++]);
  if(tokens[i]==='hundred'&&group>0&&group<20){group*=100;i++;
   if(values.has(tokens[i])){const tail=values.get(tokens[i++]);group+=tail;if(tail>=20&&values.get(tokens[i])>0&&values.get(tokens[i])<10)group+=values.get(tokens[i++]);}
  }
  while(scales[tokens[i]]&&scales[tokens[i]]<lastScale){
   lastScale=scales[tokens[i++]];total+=group*lastScale;group=0;
   if(!values.has(tokens[i]))break;
   group=values.get(tokens[i++]);
   if(group>=20&&values.get(tokens[i])>0&&values.get(tokens[i])<10)group+=values.get(tokens[i++]);
   if(tokens[i]==='hundred'&&group>0&&group<20){group*=100;i++;if(values.has(tokens[i])){const tail=values.get(tokens[i++]);group+=tail;if(tail>=20&&values.get(tokens[i])>0&&values.get(tokens[i])<10)group+=values.get(tokens[i++]);}}
  }
  let value=String(total+group);
  if(tokens[i]==='point'&&values.has(tokens[i+1])&&values.get(tokens[i+1])<10){
   i++;let fraction='';while(values.has(tokens[i])&&values.get(tokens[i])<10)fraction+=values.get(tokens[i++]);
   value=String(Number(value+'.'+fraction));
  }
  result.push(value);
  onToken?.(value,start,i);
 }
 return result;
}
