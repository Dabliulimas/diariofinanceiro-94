
import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const INVESTMENT_QUOTES = [
  "O tempo é o amigo do negócio maravilhoso. - Warren Buffett",
  "Não é o quanto você ganha, mas o quanto economiza. - Warren Buffett",
  "O investimento mais rentável é investir em você mesmo. - Warren Buffett",
  "Seja ganancioso quando outros têm medo. - Warren Buffett",
  "Nunca perca dinheiro. Nunca esqueça esta regra. - Warren Buffett",
  "Não coloque todos os ovos na mesma cesta. - Diversificação",
  "A melhor hora para plantar foi há 20 anos. A segunda melhor é agora. - Provérbio",
  "Dinheiro é apenas uma ferramenta para sua liberdade. - Ayn Rand",
  "Economize primeiro, depois gaste o que sobrar. - Warren Buffett",
  "O mercado recompensa a paciência. - Warren Buffett",
  "A disciplina é a ponte entre metas e realizações. - Jim Rohn",
  "Invista em si mesmo. Seu futuro agradecerá. - Benjamin Franklin",
  "Os juros compostos são a oitava maravilha do mundo. - Albert Einstein",
  "Não gaste para impressionar quem você nem conhece. - Will Rogers",
  "A simplicidade é o último grau de sofisticação. - Leonardo da Vinci"
];

const DailyWisdomQuote: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  
  const getDayOfYear = (): number => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };
  
  const todaysQuote = useMemo(() => {
    const dayOfYear = getDayOfYear();
    return INVESTMENT_QUOTES[dayOfYear % INVESTMENT_QUOTES.length];
  }, []);
  
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * INVESTMENT_QUOTES.length);
    setCurrentQuoteIndex(randomIndex);
  };
  
  const displayQuote = currentQuoteIndex > 0 ? INVESTMENT_QUOTES[currentQuoteIndex] : todaysQuote;
  
  if (isCollapsed) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 mb-4 border-2 border-amber-200 shadow-md">
        <Button
          onClick={() => setIsCollapsed(false)}
          variant="ghost"
          className="w-full flex items-center justify-center text-sm text-amber-800 hover:text-amber-900 hover:bg-amber-100"
        >
          <span className="mr-2">💡</span>
          <span className="font-medium">Sabedoria dos Investidores</span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 mb-6 border-2 border-amber-200 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <h3 className="text-base font-bold text-amber-800">Sabedoria dos Investidores</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={getRandomQuote}
            variant="ghost"
            size="sm"
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 p-1"
            title="Nova frase"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button
            onClick={() => setIsCollapsed(true)}
            variant="ghost"
            size="sm"
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 p-1"
            title="Minimizar"
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="text-center">
        <blockquote className="text-sm md:text-base text-amber-900 italic leading-relaxed font-medium">
          "{displayQuote}"
        </blockquote>
        
        <div className="mt-2 pt-2 border-t border-amber-200">
          <div className="text-xs text-amber-600 font-medium">
            {currentQuoteIndex > 0 ? 'Frase Aleatória' : `Frase do Dia ${getDayOfYear()}/365`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyWisdomQuote;
