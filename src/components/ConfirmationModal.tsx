
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmationWord: string;
  isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmationWord,
  isDangerous = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isValidated, setIsValidated] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsValidated(value.toLowerCase() === confirmationWord.toLowerCase());
  };

  const handleConfirm = () => {
    if (isValidated) {
      onConfirm();
      handleClose();
    }
  };

  const handleClose = () => {
    setInputValue('');
    setIsValidated(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isDangerous && (
              <AlertTriangle className="h-6 w-6 text-red-500" />
            )}
            <DialogTitle className={isDangerous ? 'text-red-600' : ''}>
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Digite "{confirmationWord}" para confirmar:
            </label>
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={confirmationWord}
              className={`mt-1 ${
                inputValue && !isValidated ? 'border-red-500' : ''
              }`}
              autoComplete="off"
            />
            {inputValue && !isValidated && (
              <p className="text-sm text-red-500 mt-1">
                Palavra de confirmação incorreta
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            variant={isDangerous ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!isValidated}
          >
            {isDangerous ? "🗑️" : "✅"} Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
