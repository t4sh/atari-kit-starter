const markdownIt = require("markdown-it");

module.exports = function (eleventyConfig) {
  // -- Markdown engine -------------------------------------------------------
  // html: false — markdown authors cannot inject raw HTML. Flip to true only
  // when every markdown source (frontmatter, _data, *.md) is trusted.
  const md = markdownIt({ html: false, linkify: true, typographer: true });
  eleventyConfig.setLibrary("md", md);

  // -- Passthrough copy ------------------------------------------------------
  eleventyConfig.addPassthroughCopy({ "src/assets/css": "assets/css" });
  eleventyConfig.addPassthroughCopy({ "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/images": "assets/images" });

  // -- Filters ---------------------------------------------------------------

  // Render markdown string to HTML
  eleventyConfig.addFilter("md", (content) => {
    return md.render(content || "");
  });

  // JSON stringify for debugging in a <pre>. NEVER use inside a <script>
  // tag — use `jsonScript` for that (it escapes < / > / U+2028 / U+2029).
  eleventyConfig.addFilter("dump", (obj) => {
    return JSON.stringify(obj, null, 2);
  });

  // Safely embed a value inside a <script> tag. Escapes characters that
  // would otherwise break out of the script context or cause silent JS
  // parse errors. Use as: <script>window.X = {{ data | jsonScript | safe }};</script>
  eleventyConfig.addFilter("jsonScript", (val) =>
    JSON.stringify(val ?? null)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029"),
  );

  // URL allow-list for hrefs/srcs sourced from data files, CMS, or
  // frontmatter. Strips javascript:, data:, vbscript:, file: and any
  // unknown scheme; passes http(s), mailto, tel, relative, fragment,
  // and query-only forms. Returns "#" for empty / non-string / blocked.
  eleventyConfig.addFilter("safe_url", (url) => {
    if (!url || typeof url !== "string") return "#";
    const trimmed = url.trim();
    if (!trimmed) return "#";
    if (
      trimmed.startsWith("/") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("?")
    )
      return trimmed;
    if (/^(https?|mailto|tel):/i.test(trimmed)) return trimmed;
    return "#";
  });

  // Array slicing — named `slice_range` to avoid shadowing Nunjucks'
  // built-in `slice` filter (which has a different "chunks of N" signature).
  eleventyConfig.addFilter("slice_range", (arr, start, end) => {
    if (!Array.isArray(arr)) return arr;
    return arr.slice(start, end);
  });

  // Take first N items
  eleventyConfig.addFilter("limit", (arr, count) => {
    if (!Array.isArray(arr)) return arr;
    return arr.slice(0, count);
  });

  // Normalize a URL for active-state matching and canonical hrefs.
  // Strips query, fragment, .html/index.html suffix, and trailing slash
  // (except root). Returns "/" for empty / non-string inputs.
  eleventyConfig.addFilter("normalize_path", (url) => {
    if (!url || typeof url !== "string") return "/";
    let p = url.split("?")[0].split("#")[0] || "/";
    if (p.endsWith("/index.html")) p = p.slice(0, -"/index.html".length) || "/";
    else if (p.endsWith(".html")) p = p.slice(0, -".html".length) || "/";
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p || "/";
  });

  // Filter by key=value. Both sides are string-coerced so template-supplied
  // strings ("5") match JSON-loaded numbers (5) — common when filtering
  // collections against frontmatter or data-file inputs.
  eleventyConfig.addFilter("where", (arr, key, val) => {
    if (!Array.isArray(arr)) return arr;
    const target = String(val);
    return arr.filter((item) => String(item[key]) === target);
  });

  // Sort by key
  eleventyConfig.addFilter("sort_by", (arr, key) => {
    if (!Array.isArray(arr)) return arr;
    return [...arr].sort((a, b) => (a[key] > b[key] ? 1 : -1));
  });

  // Parse a JSON string. Renamed from `json` to avoid colliding with the
  // conventional "render as JSON" filter name.
  eleventyConfig.addFilter("parseJson", (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  });

  // Object keys / values
  eleventyConfig.addFilter("keys", (obj) => (obj ? Object.keys(obj) : []));
  eleventyConfig.addFilter("values", (obj) => (obj ? Object.values(obj) : []));

  // Current year
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // -- Watch targets ---------------------------------------------------------
  eleventyConfig.addWatchTarget("src/assets/");

  // -- Dev server ------------------------------------------------------------
  eleventyConfig.setServerOptions({
    liveReload: true,
    port: 3000,
  });

  // -- Return config ---------------------------------------------------------
  return {
    dir: {
      input: "src/pages",
      includes: "../_includes",
      data: "../_data",
      output: "out",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
