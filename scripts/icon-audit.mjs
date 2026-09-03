import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetDirs = ['app', 'components'];

// Common icons we expect to exist
const knownIcons = new Set(['Home', 'Search', 'Menu', 'X', 'ChevronDown', 'ChevronRight', 'ArrowRight', 'ArrowLeft', 'CheckCircle', 'AlertCircle', 'AlertTriangle', 'RefreshCw', 'Globe', 'MessageCircle', 'Share2', 'Video', 'User', 'Clock', 'FileText', 'Building2', 'GraduationCap', 'Briefcase', 'Award', 'Shield', 'ShieldCheck', 'Phone', 'Mail', 'MapPin', 'ExternalLink', 'Inbox', 'Edit2', 'Save', 'Plus', 'Copy', 'Trash2', 'Eye', 'XCircle', 'Loader2', 'Key', 'Smartphone', 'History', 'Smartphone', 'Save', 'Camera', 'Bell', 'Download', 'Activity', 'TrendingUp', 'Gift', 'Building', 'Zap', 'Layers', 'Cpu', 'Unplug', 'Monitor', 'Eye', 'Zap', 'Layers', 'Activity', 'Monitor', 'Cpu', 'Unplug']);

function auditIcons(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        auditIcons(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lucideMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/);
      
      if (lucideMatch) {
        const imports = lucideMatch[1].split(',').map(i => i.trim().split(' as ')[0].trim()).filter(Boolean);
        for (const icon of imports) {
          // This is a naive check - in a real environment we'd check against the lucide-react package
          // But here I'm looking for obviously mangled names or empty strings
          if (icon === '' || icon.includes(' ') || icon.includes('-')) {
            console.log(`[AUDIT] Potential broken icon import: "${icon}" in ${fullPath}`);
          }
        }
      }
    }
  }
}

console.log('--- STARTING ICON AUDIT ---');
targetDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) auditIcons(fullPath);
});
console.log('--- AUDIT COMPLETE ---');
