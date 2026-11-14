/** Parse argv without invoking a shell. Quoted arguments must reach Node/git
 * intact; unsupported shell operators are rejected rather than misexecuted. */
export function commandArguments(command) {
  const args=[];
  let value='', quote='', escape=false, started=false;
  for (const character of command) {
    if(escape){value+=character;escape=false;started=true;continue;}
    if(character==='\\' && quote!=="'"){escape=true;started=true;continue;}
    if(quote){if(character===quote)quote='';else value+=character;continue;}
    if(character==='"'||character==="'"){quote=character;started=true;continue;}
    if(/\s/.test(character)){if(started){args.push(value);value='';started=false;}continue;}
    if(/[;&|<>`]/.test(character))throw new Error('shell_operators_require_terminal');
    value+=character;started=true;
  }
  if(quote||escape)throw new Error('invalid_command_quoting');
  if(started)args.push(value);
  return args;
}
