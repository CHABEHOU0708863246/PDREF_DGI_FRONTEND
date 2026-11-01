module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run build && node scripts/serve-lighthouse.cjs',
      startServerReadyPattern: 'LIGHTHOUSE_READY',
      startServerReadyTimeout: 120000,
      url: [
        'http://localhost:4000/dashboard/my-notifications?lighthouse=1',
        'http://localhost:4000/dashboard/my-notifications?lighthouse=1&notificationCenter=open',
      ],
      puppeteerScript: 'scripts/lighthouse-auth.js',
      puppeteerLaunchOptions: {
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      },
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'lighthouse-report',
    },
  },
};
