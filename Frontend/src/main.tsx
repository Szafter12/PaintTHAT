import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/reset.css';
import './styles/assets.css';
import './styles/button.css';
import './styles/menu.css';
import './styles/host.css';
import './styles/tekst.css';

const rootElement = document.getElementById('app') || document.getElementById('root');

if (!rootElement) {
  throw new Error('Nie znaleziono elementu #app ani #root w index.html');
}

ReactDOM.createRoot(rootElement).render(<App />);