module.exports = {
  ci: {
    collect: {
      startServerCommand:
        'npm run build -- --configuration lighthouse && node scripts/serve-lighthouse.cjs',
      startServerReadyPattern: 'LIGHTHOUSE_READY',
      startServerReadyTimeout: 120000,
      url: [
        'http://localhost:4000/dashboard/my-notifications?lighthouse=1',
        'http://localhost:4000/dashboard/my-notifications?lighthouse=1&notificationCenter=open',
        'http://localhost:4000/dashboard/contribuables?lighthouse=1',
        'http://localhost:4000/dashboard/courriers?lighthouse=1',
        'http://localhost:4000/dashboard/admin/workflows?lighthouse=1',
        'http://localhost:4000/dashboard/demandes?lighthouse=1',
        'http://localhost:4000/dashboard/suivis?lighthouse=1',
        'http://localhost:4000/dashboard/demandes/lh-demande-1?lighthouse=1',
        'http://localhost:4000/dashboard/demandes/nouvelle?lighthouse=1',
        'http://localhost:4000/dashboard/ctf/a-activer?lighthouse=1',
        'http://localhost:4000/dashboard/ctf/suivi?lighthouse=1',
        'http://localhost:4000/dashboard/rejets?lighthouse=1',
        'http://localhost:4000/dashboard/rejets/lh-rejet-1?lighthouse=1',
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
