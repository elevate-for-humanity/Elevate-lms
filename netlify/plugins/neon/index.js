// No-op stub — overrides the broken Neon marketplace extension.
// The Neon extension was installed via Netlify UI but its package URL
// is broken (DNS ENOTFOUND). This local stub prevents the build from
// failing while the extension is removed from the Netlify dashboard.
module.exports = {};
