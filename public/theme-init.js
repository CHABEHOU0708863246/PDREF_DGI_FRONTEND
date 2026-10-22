/* Preference d'affichage uniquement. Aucune donnee personnelle. */
(function () {
  try {
    var key = 'pdref_theme';
    var stored = window.localStorage.getItem(key);
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || ((!stored || stored === 'system') && prefersDark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (error) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
