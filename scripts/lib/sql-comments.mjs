/** Remove SQL comments without changing literals, identifiers or line numbers. */
export function stripSqlComments(sql) {
  return sql.replace(
    /'(?:''|[^'])*'|"(?:""|[^"])*"|\$(\w*)\$[\s\S]*?\$\1\$|--[^\r\n]*|\/\*[\s\S]*?\*\//g,
    (token) =>
      token.startsWith('--') || token.startsWith('/*') ? token.replace(/[^\r\n]/g, ' ') : token,
  );
}
