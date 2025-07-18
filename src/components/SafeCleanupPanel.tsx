
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { useDataCleanup } from '../hooks/useDataCleanup';

const SafeCleanupPanel: React.FC = () => {
  const { clearAllData, clearTransactionsOnly } = useDataCleanup();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showFullCleanupModal, setShowFullCleanupModal] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 p-2">
        <div className="max-w-7xl mx-auto">
          <details className="group">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2">
              <span>⚙️ Ferramentas de Desenvolvedor</span>
              <span className="transform group-open:rotate-180 transition-transform">▼</span>
            </summary>
            
            <div className="mt-3 flex flex-col sm:flex-row justify-center gap-2">
              <Button
                onClick={() => setShowTransactionModal(true)}
                variant="outline"
                size="sm"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpar Transações
              </Button>
              
              <Button
                onClick={() => setShowFullCleanupModal(true)}
                variant="outline"
                size="sm"
                className="border-red-500 text-red-600 hover:bg-red-50 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Reset Completo
              </Button>
            </div>
          </details>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onConfirm={clearTransactionsOnly}
        title="Limpar Transações"
        description="Esta ação irá remover todas as transações e dados financeiros, mas manterá configurações como reserva de emergência e gastos fixos."
        confirmationWord="LIMPAR"
        isDangerous={false}
      />

      <ConfirmationModal
        isOpen={showFullCleanupModal}
        onClose={() => setShowFullCleanupModal(false)}
        onConfirm={clearAllData}
        title="Reset Completo do Sistema"
        description="⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados do sistema, incluindo transações, configurações, reserva de emergência e gastos fixos. Esta ação não pode ser desfeita!"
        confirmationWord="RESETAR"
        isDangerous={true}
      />
    </>
  );
};

export default SafeCleanupPanel;
