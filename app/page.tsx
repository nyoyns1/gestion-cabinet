import dynamic from 'next/dynamic';

// On charge le composant App de manière dynamique avec ssr: false
// car App.tsx utilise HashRouter et localStorage qui ne fonctionnent que côté client (navigateur).
const ClientApp = dynamic(() => import('../App'), { ssr: false });

export default function Home() {
  return <ClientApp />;
}