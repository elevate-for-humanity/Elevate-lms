#!/usr/bin/env python3
"""
Elevate Site Technical Audit v3

Modes:
  http-audit  : Security headers, cookies, SEO metadata, robots/sitemap, per-page scoring.
  crawl-a11y  : Playwright + axe-core for broken links, a11y violations, optional screenshots/HAR.

Usage:
  python3 tools/elevate_site_audit.py http-audit https://www.elevateforhumanity.org --out audit_http.json
  python3 tools/elevate_site_audit.py crawl-a11y https://www.elevateforhumanity.org --out audit_crawl.json \
    --max-pages 80 --screenshot --har --artifacts-dir artifacts

Install for crawl-a11y:
  npm i -D axe-core
  pip install playwright && npx playwright install --with-deps chromium
"""
from __future__ import annotations

import argparse
import dataclasses
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Dict, List, Optional, Sequence, Tuple

DEFAULT_UA = "ElevateSiteAudit/3.0"
DEFAULT_TIMEOUT = 25


def _now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _join(b, p):
    return urllib.parse.urljoin(b.rstrip("/") + "/", p.lstrip("/"))


def _same_origin(a, b):
    pa, pb = urllib.parse.urlparse(a), urllib.parse.urlparse(b)
    return (pa.scheme, pa.netloc) == (pb.scheme, pb.netloc)


def _norm(url):
    p = urllib.parse.urlparse(url)._replace(fragment="")
    nl = p.netloc
    if (p.scheme == "https" and nl.endswith(":443")) or (
        p.scheme == "http" and nl.endswith(":80")
    ):
        nl = nl.rsplit(":", 1)[0]
    return urllib.parse.urlunparse(
        p._replace(netloc=nl, path=re.sub(r"/{2,}", "/", p.path or "/"))
    )


def _safename(url):
    p = urllib.parse.urlparse(url)
    b = re.sub(r"[^a-zA-Z0-9._-]+", "_", f"{p.netloc}{p.path}".strip("/") or "root")
    return b[:180]


# ── HTTP fetch ──────────────────────────────────────────────────────
@dataclass
class Fetch:
    url: str
    final_url: str
    status: int
    headers: Dict[str, str]
    raw_headers: List[Tuple[str, str]]
    content_type: str
    body: bytes


def fetch(url, ua=DEFAULT_UA, timeout=DEFAULT_TIMEOUT):
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    try:
        with urllib.request.build_opener().open(req, timeout=timeout) as r:
            raw = list(r.headers.items())
            h = {k.lower(): v for k, v in raw}
            return Fetch(url, r.geturl(), r.status, h, raw, h.get("content-type", ""), r.read())
    except urllib.error.HTTPError as e:
        raw = list(e.headers.items()) if e.headers else []
        h = {k.lower(): v for k, v in raw}
        body = e.read() if hasattr(e, "read") else b""
        return Fetch(
            url, getattr(e, "url", url), int(e.code or 0), h, raw, h.get("content-type", ""), body
        )


# ── HTML head parser ────────────────────────────────────────────────
class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self._in_t = False
        self._tb: List[str] = []
        self.title: Optional[str] = None
        self.canonicals: List[str] = []
        self.meta: Dict[Tuple[str, str], str] = {}
        self.has_jsonld = False

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        t = tag.lower()
        if t == "title":
            self._in_t = True
            return
        if t == "link" and a.get("rel", "").lower() == "canonical":
            href = a.get("href", "").strip()
            if href:
                self.canonicals.append(href)
            return
        if t == "meta":
            n = a.get("name", "").strip().lower()
            p = a.get("property", "").strip().lower()
            c = a.get("content", "").strip()
            if n and c:
                self.meta[("name", n)] = c
            if p and c:
                self.meta[("property", p)] = c
            return
        if t == "script" and a.get("type", "").strip().lower() == "application/ld+json":
            self.has_jsonld = True

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self._in_t = False
            if self.title is None:
                self.title = "".join(self._tb).strip() or None
            self._tb = []

    def handle_data(self, d):
        if self._in_t:
            self._tb.append(d)


# ── Validation helpers ──────────────────────────────────────────────
@dataclass
class HdrIssue:
    header: str
    issue: str


@dataclass
class CkIssue:
    name: str
    issue: str


@dataclass
class ScoreItem:
    key: str
    delta: int
    reason: str


def validate_headers(h, https):
    issues = []
    hl = {k.lower(): v for k, v in h.items()}
    csp = hl.get("content-security-policy")
    if not csp:
        issues.append(HdrIssue("csp", "missing"))
    elif "unsafe-inline" in csp:
        issues.append(HdrIssue("csp", "contains_unsafe-inline"))
    hsts = hl.get("strict-transport-security")
    if https:
        if not hsts:
            issues.append(HdrIssue("hsts", "missing"))
        elif "includesubdomains" not in hsts.lower():
            issues.append(HdrIssue("hsts", "missing_includeSubDomains"))
    if not hl.get("x-content-type-options"):
        issues.append(HdrIssue("xcto", "missing"))
    if not hl.get("referrer-policy"):
        issues.append(HdrIssue("referrer-policy", "missing"))
    if not hl.get("permissions-policy"):
        issues.append(HdrIssue("permissions-policy", "missing"))
    return issues


def validate_cookies(raw_headers, https):
    issues = []
    for k, v in raw_headers:
        if k.lower() != "set-cookie":
            continue
        parts = [p.strip() for p in v.split(";") if p.strip()]
        if not parts or "=" not in parts[0]:
            continue
        name = parts[0].split("=", 1)[0].strip()
        attrs = {p.split("=", 1)[0].strip().lower() for p in parts[1:]}
        if "httponly" not in attrs:
            issues.append(CkIssue(name, "missing_HttpOnly"))
        if https and "secure" not in attrs:
            issues.append(CkIssue(name, "missing_Secure"))
    return issues


def compute_score(status, flags, hdr_issues, ck_issues):
    s = 100
    bd = []

    def d(k, p, r):
        nonlocal s
        s -= p
        bd.append(ScoreItem(k, -p, r))

    if status >= 500:
        d("http", 50, f"HTTP {status}")
    elif status >= 400:
        d("http", 35, f"HTTP {status}")
    for f in flags:
        if "missing_canonical" in f:
            d("seo", 10, "Missing canonical")
        elif "missing_title" in f:
            d("seo", 5, "Missing title")
        elif "missing_meta_description" in f:
            d("seo", 5, "Missing meta description")
        elif "cookie_banner_dup" in f:
            d("ux", 3, "Duplicate cookie banner")
    for hi in hdr_issues:
        if hi.issue == "missing":
            d("security", 8, f"{hi.header} missing")
        else:
            d("security", 4, f"{hi.header}: {hi.issue}")
    for ci in ck_issues:
        d("cookies", 2, f"{ci.name}: {ci.issue}")
    return max(0, min(100, s)), bd


# ── Page audit ──────────────────────────────────────────────────────
def audit_page(url, ua, timeout):
    fr = fetch(url, ua, timeout)
    https = urllib.parse.urlparse(fr.final_url).scheme == "https"
    flags = []
    title = None
    canonicals = []
    desc = None
    og_t = None
    og_d = None
    jsonld = False
    hdr_issues = validate_headers(fr.headers, https)
    ck_issues = validate_cookies(fr.raw_headers, https)

    if "text/html" in fr.content_type.lower():
        html = fr.body.decode("utf-8", errors="replace")
        hp = HeadParser()
        hp.feed(html)
        title = hp.title
        canonicals = hp.canonicals
        desc = hp.meta.get(("name", "description"))
        og_t = hp.meta.get(("property", "og:title"))
        og_d = hp.meta.get(("property", "og:description"))
        jsonld = hp.has_jsonld
        if not title:
            flags.append("missing_title")
        if not desc:
            flags.append("missing_meta_description")
        if not canonicals:
            flags.append("missing_canonical")
        if len(canonicals) > 1:
            flags.append(f"multiple_canonicals:{len(canonicals)}")
        if (
            "We use cookies to operate the Elevate" in html
            and "We Value Your Privacy" in html
        ):
            flags.append("cookie_banner_dup")

    if fr.status >= 400:
        flags.append(f"http_error:{fr.status}")

    s, bd = compute_score(fr.status, flags, hdr_issues, ck_issues)
    return {
        "url": fr.url,
        "final_url": fr.final_url,
        "status": fr.status,
        "content_type": fr.content_type,
        "title": title,
        "canonicals": canonicals,
        "meta_description": desc,
        "og_title": og_t,
        "og_description": og_d,
        "has_jsonld": jsonld,
        "header_issues": [dataclasses.asdict(i) for i in hdr_issues],
        "cookie_issues": [dataclasses.asdict(i) for i in ck_issues],
        "flags": flags,
        "score": s,
        "score_breakdown": [dataclasses.asdict(i) for i in bd],
    }


# ── HTTP audit mode ─────────────────────────────────────────────────
def http_audit(base, ua, timeout):
    base = base.rstrip("/")
    targets = [
        "/",
        "/programs",
        "/programs/cna",
        "/white-label",
        "/store",
        "/privacy-policy",
        "/governance/security",
        "/robots.txt",
        "/sitemap.xml",
    ]
    pages = []
    for p in targets:
        url = _join(base, p)
        try:
            pages.append(audit_page(url, ua, timeout))
        except Exception as e:
            pages.append({"url": url, "error": repr(e)})

    fr = fetch(_join(base, "/robots.txt"), ua, timeout)
    robots = {"status": fr.status, "sitemaps": [], "sitemap_checks": []}
    if fr.status < 400:
        txt = fr.body.decode("utf-8", errors="replace")
        sms = re.findall(r"(?im)^\s*Sitemap:\s*(\S+)", txt)
        robots["sitemaps"] = sms
        for sm in sms:
            sf = fetch(_norm(sm), ua, timeout)
            robots["sitemap_checks"].append({
                "url": sm,
                "status": sf.status,
                "looks_like_xml": b"<urlset" in sf.body[:800].lower(),
            })

    return {"mode": "http-audit", "generated_at": _now(), "base": base, "pages": pages, "robots": robots}


# ── Crawl + a11y mode ───────────────────────────────────────────────
def crawl_a11y(base, max_pages, ua, timeout, art_dir, screenshots, har):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise RuntimeError("Run: pip install playwright && npx playwright install chromium")

    axe_js = None
    for c in [
        os.path.join(os.getcwd(), "node_modules", "axe-core", "axe.min.js"),
        os.path.join(os.getcwd(), "node_modules", "axe-core", "axe.js"),
    ]:
        if os.path.isfile(c):
            with open(c) as f:
                axe_js = f.read()
            break
    if not axe_js:
        raise RuntimeError("Run: npm i -D axe-core")

    os.makedirs(art_dir, exist_ok=True)
    base = base.rstrip("/")
    queue = [_norm(_join(base, p)) for p in ["/", "/programs", "/store", "/white-label"]]
    seen: set = set()
    pages_out: List[dict] = []
    broken: List[dict] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(user_agent=ua)
        ctx.set_default_timeout(timeout * 1000)

        while queue and len(seen) < max_pages:
            url = _norm(queue.pop(0))
            if url in seen:
                continue
            seen.add(url)
            pr: Dict = {"url": url, "final_url": None, "status": None, "a11y": None, "errors": [], "artifacts": {}}
            page = ctx.new_page()
            try:
                resp = page.goto(url, wait_until="domcontentloaded")
                pr["status"] = resp.status if resp else None
                pr["final_url"] = page.url

                for href in page.eval_on_selector_all(
                    "a[href]", "els=>els.map(e=>e.getAttribute('href')).filter(Boolean)"
                ):
                    if href.startswith(("mailto:", "tel:", "javascript:")):
                        continue
                    r = _norm(urllib.parse.urljoin(page.url, href))
                    if _same_origin(r, base) and r not in seen:
                        queue.append(r)

                # axe scan
                try:
                    page.add_script_tag(content=axe_js)
                    axe = page.evaluate(
                        "async()=>{const r=await axe.run(document,"
                        "{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}});return r;}"
                    )
                    pr["a11y"] = [
                        {
                            "id": v["id"],
                            "impact": v.get("impact"),
                            "help": v.get("help"),
                            "nodes": len(v.get("nodes", [])),
                        }
                        for v in axe.get("violations", [])
                    ]
                except Exception as e:
                    pr["errors"].append(f"axe:{e}")

                # screenshot on error pages
                capture = (pr.get("status") or 0) >= 400 or pr["errors"]
                if screenshots and capture:
                    pp = os.path.join(art_dir, f"{_safename(url)}.png")
                    try:
                        page.screenshot(path=pp, full_page=True)
                        pr["artifacts"]["screenshot"] = pp
                    except Exception:
                        pass

            except Exception as e:
                pr["errors"].append(repr(e))
            finally:
                page.close()
                pages_out.append(pr)

        ctx.close()
        browser.close()

    return {
        "mode": "crawl-a11y",
        "generated_at": _now(),
        "base": base,
        "max_pages": max_pages,
        "pages": pages_out,
        "broken_links": broken,
    }


# ── CLI ─────────────────────────────────────────────────────────────
def main(argv=None):
    ap = argparse.ArgumentParser(description="Elevate Site Technical Audit v3")
    ap.add_argument("mode", choices=["http-audit", "crawl-a11y"])
    ap.add_argument("base_url")
    ap.add_argument("--out", default="audit_report.json")
    ap.add_argument("--max-pages", type=int, default=80)
    ap.add_argument("--ua", default=DEFAULT_UA)
    ap.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    ap.add_argument("--artifacts-dir", default="artifacts")
    ap.add_argument("--screenshot", action="store_true")
    ap.add_argument("--har", action="store_true")
    args = ap.parse_args(argv)
    base = _norm(args.base_url)

    if args.mode == "http-audit":
        report = http_audit(base, args.ua, args.timeout)
    else:
        report = crawl_a11y(
            base, args.max_pages, args.ua, args.timeout,
            args.artifacts_dir, args.screenshot, args.har,
        )

    with open(args.out, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
