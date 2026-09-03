/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AssetCacheManager {
  constructor() {
    this.cacheDir = path.join(__dirname, 'cached-assets');
    this.manifestPath = path.join(__dirname, 'asset-manifest.json');
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  // Optimize and cache large files
  optimizeAssets() {
    const heavyAssets = this.findHeavyAssets();
    const results = {
      cached: 0,
      spaceSaved: 0,
      manifest: {},
    };

    heavyAssets.forEach((asset) => {
      const cached = this.cacheAsset(asset);
      if (cached) {
        results.cached++;
        results.spaceSaved += asset.size - cached.newSize;
        results.manifest[asset.path] = cached;
      }
    });

    this.saveManifest(results.manifest);
    return results;
  }

  findHeavyAssets() {
    const heavyAssets = [];
    const searchDirs = ['attached_assets', 'scripts', 'tools', 'branding'];

    searchDirs.forEach((dir) => {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir, heavyAssets);
      }
    });

    return heavyAssets.filter((asset) => asset.size > 100 * 1024); // >100KB
  }

  scanDirectory(dir, assets) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach((item) => {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        this.scanDirectory(fullPath, assets);
      } else if (this.shouldCache(item.name)) {
        const stats = fs.statSync(fullPath);
        assets.push({
          path: fullPath,
          name: item.name,
          size: stats.size,
          type: this.getAssetType(item.name),
        });
      }
    });
  }

  shouldCache(filename) {
    const cacheableExts = [
      '.js',
      '.css',
      '.json',
      '.html',
      '.png',
      '.jpg',
      '.jpeg',
    ];
    return cacheableExts.some((ext) => filename.toLowerCase().endsWith(ext));
  }

  getAssetType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const typeMap = {
      '.js': 'script',
      '.css': 'style',
      '.json': 'data',
      '.html': 'page',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
    };
    return typeMap[ext] || 'other';
  }

  cacheAsset(asset) {
    try {
      const content = fs.readFileSync(asset.path);
      const hash = crypto
        .createHash('md5')
        .update(content)
        .digest('hex')
        .substring(0, 8);
      const cachedName = `${hash}-${asset.name}`;
      const cachedPath = path.join(this.cacheDir, cachedName);

      // Create optimized version based on type
      let optimizedContent = content;

      if (asset.type === 'script' || asset.type === 'style') {
        optimizedContent = this.minifyContent(content, asset.type);
      } else if (asset.type === 'data') {
        optimizedContent = this.compressJSON(content);
      }

      fs.writeFileSync(cachedPath, optimizedContent);

      const newStats = fs.statSync(cachedPath);
      const compressionRatio = (
        ((asset.size - newStats.size) / asset.size) *
        100
      ).toFixed(1);


      return {
        originalPath: asset.path,
        cachedPath: cachedPath,
        hash: hash,
        originalSize: asset.size,
        newSize: newStats.size,
        compressionRatio: compressionRatio,
        type: asset.type,
      };
    } catch (error) {
      return null;
    }
  }

  minifyContent(content, type) {
    const text = content.toString();

    if (type === 'script') {
      // Basic JS minification
      return text
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
    } else if (type === 'style') {
      // Basic CSS minification
      return text
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
        .trim();
    }

    return content;
  }

  compressJSON(content) {
    try {
      const parsed = JSON.parse(content.toString());
      return JSON.stringify(parsed); // Remove formatting
    } catch {
      return content; // Return original if not valid JSON
    }
  }

  saveManifest(manifest) {
    const manifestData = {
      generated: new Date().toISOString(),
      cachedAssets: manifest,
      totalAssets: Object.keys(manifest).length,
      cacheDirectory: this.cacheDir,
    };

    fs.writeFileSync(this.manifestPath, JSON.stringify(manifestData, null, 2));
  }

  // Serve cached asset
  serveCachedAsset(originalPath) {
    const manifest = this.loadManifest();
    const cached = manifest.cachedAssets[originalPath];

    if (cached && fs.existsSync(cached.cachedPath)) {
      return fs.readFileSync(cached.cachedPath);
    }

    return null; // Fall back to original
  }

  loadManifest() {
    if (fs.existsSync(this.manifestPath)) {
      return JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
    }
    return { cachedAssets: {} };
  }
}

// Run optimization
const cacheManager = new AssetCacheManager();
const results = cacheManager.optimizeAssets();

  `   • Space saved: ~${Math.round(results.spaceSaved / 1024 / 1024)}MB`
);

module.exports = AssetCacheManager;
