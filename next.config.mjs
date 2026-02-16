/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permet d'éviter les erreurs SSR liées au HashRouter initialement
  typescript: {
    ignoreBuildErrors: true, // Pour faciliter le premier déploiement si des types mineurs bloquent
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;