
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Update document title
document.title = 'Diário Financeiro - Coach Inteligente com IA Preditiva';

createRoot(document.getElementById("root")!).render(<App />);
