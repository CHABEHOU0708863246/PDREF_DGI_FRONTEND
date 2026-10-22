export const environment = {
  production: true,
  // Application mobile (Capacitor) : même API backend déployée.
  // En dev sur appareil réel, remplacer par l'IP LAN du PC (ex. http://192.168.1.20:5121).
  apiUrl: 'https://api.pdref.dgi.ci',
  authMode: 'http' as 'http' | 'demo',
};
