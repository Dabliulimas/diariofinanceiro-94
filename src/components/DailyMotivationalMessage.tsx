
import React, { useState, useEffect } from 'react';

const DailyMotivationalMessage = () => {
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('');

  const investorQuotes = [
    {
      quote: "O tempo é o amigo do negócio maravilhoso e o inimigo do medíocre.",
      author: "Warren Buffett"
    },
    {
      quote: "Nosso trabalho favorito é comprar uma empresa fantástica a um preço justo, não uma empresa justa a um preço fantástico.",
      author: "Warren Buffett"
    },
    {
      quote: "O risco vem de não saber o que você está fazendo.",
      author: "Warren Buffett"
    },
    {
      quote: "Seja temeroso quando outros são gananciosos e ganancioso quando outros são temerosos.",
      author: "Warren Buffett"
    },
    {
      quote: "O investidor inteligente é um realista que vende para otimistas e compra de pessimistas.",
      author: "Benjamin Graham"
    },
    {
      quote: "O preço é o que você paga. O valor é o que você recebe.",
      author: "Warren Buffett"
    },
    {
      quote: "A primeira regra do investimento é nunca perder dinheiro. A segunda regra é nunca esquecer a primeira regra.",
      author: "Warren Buffett"
    },
    {
      quote: "Diversificação é proteção contra ignorância. Faz pouco sentido se você sabe o que está fazendo.",
      author: "Warren Buffett"
    },
    {
      quote: "Um investimento em conhecimento paga os melhores juros.",
      author: "Benjamin Franklin"
    },
    {
      quote: "O mercado de ações é um dispositivo para transferir dinheiro do impaciente para o paciente.",
      author: "Warren Buffett"
    },
    {
      quote: "Não é quanto dinheiro você ganha, mas quanto dinheiro você mantém, como ele trabalha duro para você, e por quantas gerações você o mantém.",
      author: "Robert Kiyosaki"
    },
    {
      quote: "A pessoa rica adquire ativos. A pessoa pobre e classe média adquirem passivos que pensam que são ativos.",
      author: "Robert Kiyosaki"
    },
    {
      quote: "No curto prazo, o mercado é uma máquina de votação, mas no longo prazo é uma máquina de pesagem.",
      author: "Benjamin Graham"
    },
    {
      quote: "Tempo no mercado é melhor que timing do mercado.",
      author: "Peter Lynch"
    },
    {
      quote: "O melhor momento para plantar uma árvore foi 20 anos atrás. O segundo melhor momento é agora.",
      author: "Provérbio Chinês"
    },
    {
      quote: "Invista em si mesmo. Seu career é o motor da sua riqueza.",
      author: "Paul Clitheroe"
    },
    {
      quote: "Compre quando todos estão vendendo e mantenha até que todos estejam comprando.",
      author: "J. Paul Getty"
    },
    {
      quote: "Um centavo economizado é um centavo ganho.",
      author: "Benjamin Franklin"
    },
    {
      quote: "O compound interest é a oitava maravilha do mundo. Quem entende, ganha; quem não entende, paga.",
      author: "Albert Einstein"
    },
    {
      quote: "Não conte com um único rendimento. Faça investimentos para criar uma segunda fonte.",
      author: "Warren Buffett"
    },
    {
      quote: "O dinheiro é apenas uma ferramenta. Ele o levará aonde desejar, mas não o substituirá como motorista.",
      author: "Ayn Rand"
    },
    {
      quote: "Riqueza consiste não em ter grandes posses, mas em ter poucas necessidades.",
      author: "Epíteto"
    },
    {
      quote: "O hábito de economizar é em si mesmo uma educação; desenvolve todas as virtudes.",
      author: "T.T. Munger"
    },
    {
      quote: "Não trabalhe pelo dinheiro; faça o dinheiro trabalhar para você.",
      author: "Robert Kiyosaki"
    },
    {
      quote: "A disciplina financeira é a chave para a liberdade financeira.",
      author: "Robert Kiyosaki"
    },
    {
      quote: "Investir com sucesso leva tempo, disciplina e paciência.",
      author: "Warren Buffett"
    },
    {
      quote: "O mercado de ações é projetado para transferir dinheiro do Ativo para o Paciente.",
      author: "Warren Buffett"
    },
    {
      quote: "Nunca dependa de uma única fonte de renda. Invista para criar uma segunda fonte.",
      author: "Warren Buffett"
    },
    {
      quote: "Fortuna favorece a mente preparada.",
      author: "Louis Pasteur"
    },
    {
      quote: "O segredo para ficar à frente é começar.",
      author: "Mark Twain"
    }
  ];

  useEffect(() => {
    // Use current date to select quote (will be same for entire day)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % investorQuotes.length;
    const selectedQuote = investorQuotes[quoteIndex];
    
    setMessage(selectedQuote.quote);
    setAuthor(selectedQuote.author);
  }, []);

  return (
    <div className="mb-4 sm:mb-6 md:mb-8">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 sm:p-4 md:p-6 rounded-xl shadow-lg">
        <div className="text-center">
          <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2">💡 Sabedoria de Grandes Investidores</h3>
          <blockquote className="text-xs sm:text-sm md:text-base leading-relaxed mb-2 italic">
            "{message}"
          </blockquote>
          <cite className="text-xs sm:text-sm opacity-90 font-medium">— {author}</cite>
        </div>
      </div>
    </div>
  );
};

export default DailyMotivationalMessage;
