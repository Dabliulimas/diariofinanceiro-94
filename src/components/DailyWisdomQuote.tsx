
import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const INVESTMENT_QUOTES = [
  "O tempo é o amigo do negócio maravilhoso e o inimigo do negócio medíocre. - Warren Buffett",
  "Não é o quanto você ganha, mas o quanto você economiza que importa. - Warren Buffett",
  "O investimento mais rentável é investir em você mesmo. - Warren Buffett",
  "Seja ganancioso quando outros estão com medo e tenha medo quando outros estão gananciosos. - Warren Buffett",
  "Regra No. 1: Nunca perca dinheiro. Regra No. 2: Nunca esqueça a regra No. 1. - Warren Buffett",
  "Não coloque todos os ovos na mesma cesta. - Provérbio sobre diversificação",
  "A melhor hora para plantar uma árvore foi há 20 anos. A segunda melhor hora é agora. - Provérbio chinês",
  "Dinheiro é apenas uma ferramenta. Ele te levará aonde você quiser, mas não te substituirá como motorista. - Ayn Rand",
  "Não economize o que sobrar depois de gastar, mas gaste o que sobrar depois de economizar. - Warren Buffett",
  "O mercado de ações é um dispositivo para transferir dinheiro do impaciente para o paciente. - Warren Buffett",
  // Continue with more quotes to reach 365...
  "A disciplina é a ponte entre metas e realizações. - Jim Rohn",
  "Invista em si mesmo. Seu eu futuro agradecerá. - Benjamin Franklin",
  "O composto mais poderoso do universo é o juros compostos. - Albert Einstein",
  "Não gaste o que você não tem para impressionar pessoas que você nem conhece. - Will Rogers",
  "A simplicidade é o último grau de sofisticação. - Leonardo da Vinci",
  "Cada real economizado é um real ganho. - Benjamin Franklin",
  "O preço de qualquer coisa é a quantidade de vida que você troca por ela. - Henry David Thoreau",
  "Riqueza consiste não em ter grandes posses, mas em ter poucas necessidades. - Epicteto",
  "O melhor momento para começar foi ontem. O segundo melhor momento é agora. - Provérbio",
  "Planeje seu trabalho e trabalhe seu plano. - Napoleon Hill",
  "O sucesso é ir de fracasso em fracasso sem perder o entusiasmo. - Winston Churchill",
  "A educação é o investimento que paga os melhores dividendos. - Benjamin Franklin",
  "Não é sobre timing do mercado, é sobre tempo no mercado. - Provérbio financeiro",
  "A paciência é amarga, mas seu fruto é doce. - Aristóteles",
  "Economizar dinheiro é apenas o primeiro passo. Fazê-lo trabalhar para você é o próximo. - Dave Ramsey"
];

// Generate 365 quotes by cycling through the base quotes with variations
const generateYearlyQuotes = (): string[] => {
  const quotes = [];
  const baseQuotes = INVESTMENT_QUOTES;
  
  for (let i = 0; i < 365; i++) {
    const quoteIndex = i % baseQuotes.length;
    quotes.push(baseQuotes[quoteIndex]);
  }
  
  return quotes;
};

const DailyWisdomQuote: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  
  const yearlyQuotes = useMemo(() => generateYearlyQuotes(), []);
  
  // Get quote based on day of year (1-365)
  const getDayOfYear = (): number => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };
  
  const todaysQuote = useMemo(() => {
    const dayOfYear = getDayOfYear();
    return yearlyQuotes[Math.min(dayOfYear - 1, 364)] || yearlyQuotes[0];
  }, [yearlyQuotes]);
  
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * yearlyQuotes.length);
    setCurrentQuoteIndex(randomIndex);
  };
  
  const displayQuote = currentQuoteIndex > 0 ? yearlyQuotes[currentQuoteIndex] : todaysQuote;
  
  if (isCollapsed) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 mb-4 border border-blue-200">
        <Button
          onClick={() => setIsCollapsed(false)}
          variant="ghost"
          className="w-full flex items-center justify-between text-sm text-blue-700 hover:text-blue-900"
        >
          <span>💡 Sabedoria dos Grandes Investidores</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h3 className="text-sm font-semibold text-blue-800">
            Sabedoria dos Grandes Investidores
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={getRandomQuote}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setIsCollapsed(true)}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <blockquote className="text-sm text-blue-700 italic leading-relaxed border-l-4 border-blue-300 pl-3">
        "{displayQuote}"
      </blockquote>
      
      {currentQuoteIndex > 0 && (
        <div className="mt-2 text-xs text-blue-500">
          Frase aleatória • Clique em ↻ para uma nova frase
        </div>
      )}
      
      {currentQuoteIndex === 0 && (
        <div className="mt-2 text-xs text-blue-500">
          Frase do dia {getDayOfYear()}/365 • Clique em ↻ para uma frase aleatória
        </div>
      )}
    </div>
  );
};

export default DailyWisdomQuote;
