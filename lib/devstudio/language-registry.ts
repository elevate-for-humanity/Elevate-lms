export type DevStudioLanguage = {
  id: string;
  name: string;
  extensions: readonly string[];
  basenames?: readonly string[];
};

/**
 * Canonical Dev Studio editor language matrix.
 * These IDs map to Monaco language identifiers / syntax modes. This registry is
 * intentionally maintained in source so the public language-count claim can be
 * enforced by CI instead of being hard-coded marketing copy.
 */
export const DEV_STUDIO_LANGUAGES: readonly DevStudioLanguage[] = [
  { id: 'typescript', name: 'TypeScript', extensions: ['ts', 'tsx'] },
  { id: 'javascript', name: 'JavaScript', extensions: ['js', 'jsx', 'mjs', 'cjs'] },
  { id: 'json', name: 'JSON', extensions: ['json'] },
  { id: 'json', name: 'JSON with Comments', extensions: ['jsonc'] },
  { id: 'html', name: 'HTML', extensions: ['html', 'htm'] },
  { id: 'css', name: 'CSS', extensions: ['css'] },
  { id: 'scss', name: 'SCSS', extensions: ['scss'] },
  { id: 'less', name: 'Less', extensions: ['less'] },
  { id: 'markdown', name: 'Markdown', extensions: ['md', 'mdx'] },
  { id: 'yaml', name: 'YAML', extensions: ['yaml', 'yml'] },
  { id: 'xml', name: 'XML', extensions: ['xml', 'svg', 'xsd'] },
  { id: 'graphql', name: 'GraphQL', extensions: ['graphql', 'gql'] },
  { id: 'python', name: 'Python', extensions: ['py', 'pyw'] },
  { id: 'java', name: 'Java', extensions: ['java'] },
  { id: 'c', name: 'C', extensions: ['c', 'h'] },
  { id: 'cpp', name: 'C++', extensions: ['cc', 'cpp', 'cxx', 'hpp', 'hh'] },
  { id: 'csharp', name: 'C#', extensions: ['cs'] },
  { id: 'go', name: 'Go', extensions: ['go'] },
  { id: 'rust', name: 'Rust', extensions: ['rs'] },
  { id: 'ruby', name: 'Ruby', extensions: ['rb'] },
  { id: 'php', name: 'PHP', extensions: ['php'] },
  { id: 'swift', name: 'Swift', extensions: ['swift'] },
  { id: 'kotlin', name: 'Kotlin', extensions: ['kt', 'kts'] },
  { id: 'scala', name: 'Scala', extensions: ['scala', 'sc'] },
  { id: 'r', name: 'R', extensions: ['r'] },
  { id: 'sql', name: 'SQL', extensions: ['sql'] },
  { id: 'shell', name: 'Shell', extensions: ['sh', 'bash', 'zsh', 'fish'] },
  { id: 'powershell', name: 'PowerShell', extensions: ['ps1', 'psm1', 'psd1'] },
  { id: 'bat', name: 'Batch', extensions: ['bat', 'cmd'] },
  { id: 'dockerfile', name: 'Dockerfile', extensions: [], basenames: ['dockerfile'] },
  { id: 'ini', name: 'INI', extensions: ['ini', 'cfg', 'conf', 'env'] },
  { id: 'properties', name: 'Properties', extensions: ['properties'] },
  { id: 'toml', name: 'TOML', extensions: ['toml'] },
  { id: 'hcl', name: 'HCL / Terraform', extensions: ['hcl', 'tf', 'tfvars'] },
  { id: 'lua', name: 'Lua', extensions: ['lua'] },
  { id: 'perl', name: 'Perl', extensions: ['pl', 'pm'] },
  { id: 'objective-c', name: 'Objective-C', extensions: ['m', 'mm'] },
  { id: 'dart', name: 'Dart', extensions: ['dart'] },
  { id: 'elixir', name: 'Elixir', extensions: ['ex', 'exs'] },
  { id: 'clojure', name: 'Clojure', extensions: ['clj', 'cljs', 'cljc', 'edn'] },
  { id: 'fsharp', name: 'F#', extensions: ['fs', 'fsi', 'fsx'] },
  { id: 'vb', name: 'Visual Basic', extensions: ['vb'] },
  { id: 'pascal', name: 'Pascal', extensions: ['pas'] },
  { id: 'scheme', name: 'Scheme', extensions: ['scm', 'ss'] },
  { id: 'plaintext', name: 'Plain Text', extensions: ['txt', 'log'] },
  { id: 'handlebars', name: 'Handlebars', extensions: ['hbs', 'handlebars'] },
  { id: 'razor', name: 'Razor', extensions: ['cshtml', 'razor'] },
  { id: 'pug', name: 'Pug', extensions: ['pug', 'jade'] },
  { id: 'coffee', name: 'CoffeeScript', extensions: ['coffee'] },
  { id: 'sol', name: 'Solidity', extensions: ['sol'] },
  { id: 'abap', name: 'ABAP', extensions: ['abap'] },
  { id: 'apex', name: 'Apex', extensions: ['cls', 'trigger'] },
  { id: 'cameligo', name: 'CameLIGO', extensions: ['mligo'] },
  { id: 'pascaligo', name: 'PascaLIGO', extensions: ['ligo'] },
  { id: 'postiats', name: 'ATS/Postiats', extensions: ['dats', 'sats', 'hats'] },
  { id: 'qsharp', name: 'Q#', extensions: ['qs'] },
  { id: 'redis', name: 'Redis', extensions: ['redis'] },
  { id: 'sb', name: 'Small Basic', extensions: ['sb'] },
  { id: 'st', name: 'Structured Text', extensions: ['st'] },
  { id: 'wgsl', name: 'WGSL', extensions: ['wgsl'] },
  { id: 'bicep', name: 'Bicep', extensions: ['bicep'] },
  { id: 'sparql', name: 'SPARQL', extensions: ['rq', 'sparql'] },
] as const;

export const DEV_STUDIO_LANGUAGE_COUNT = DEV_STUDIO_LANGUAGES.length;

const EXTENSION_TO_LANGUAGE = new Map<string, string>();
const BASENAME_TO_LANGUAGE = new Map<string, string>();
for (const language of DEV_STUDIO_LANGUAGES) {
  for (const extension of language.extensions) {
    if (!EXTENSION_TO_LANGUAGE.has(extension)) EXTENSION_TO_LANGUAGE.set(extension, language.id);
  }
  for (const basename of language.basenames ?? []) {
    BASENAME_TO_LANGUAGE.set(basename.toLowerCase(), language.id);
  }
}

export function detectDevStudioLanguage(filePath?: string, fallback = 'typescript'): string {
  if (!filePath) return fallback;
  const basename = filePath.split('/').pop()?.toLowerCase() ?? '';
  if (basename === '.env' || basename.startsWith('.env.')) return 'ini';
  const basenameLanguage = BASENAME_TO_LANGUAGE.get(basename);
  if (basenameLanguage) return basenameLanguage;
  const extension = basename.includes('.') ? basename.split('.').pop() ?? '' : '';
  return EXTENSION_TO_LANGUAGE.get(extension) ?? 'plaintext';
}
