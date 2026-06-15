module.exports = {
  ci: {
    collect: {
      // `serve -s` rewrites all paths to index.html (SPA fallback) so
      // client-side routes like /gallery render correctly for Lighthouse.
      startServerCommand: "npx serve -s dist -l 4500",
      startServerReadyPattern: "Accepting connections at",
      url: [
        "http://localhost:4500/",
        "http://localhost:4500/gallery",
        "http://localhost:4500/bio",
        "http://localhost:4500/contact",
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
