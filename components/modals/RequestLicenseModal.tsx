import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useFeedbackContext } from '../../context/FeedbackContext';
import { SpinnerIcon, SparklesIcon } from '../icons';

interface RequestLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestLicenseModal: React.FC<RequestLicenseModalProps> = ({ isOpen, onClose }) => {
  const { submitFeedback, email: savedEmail, setEmail: setSavedEmail } = useFeedbackContext();
  const [name, setName] = useState('');
  const [paymentIdentity, setPaymentIdentity] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Prefill email from context if available
      if (savedEmail) setEmail(savedEmail);
      // Focus name input
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, savedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    
    // Update global email if changed
    if (email !== savedEmail) {
        setSavedEmail(email);
    }

    const message = `Lizenzwunsch für: ${name}\nGezahlt über: ${paymentIdentity || 'Nicht angegeben (vermutlich identisch)'}`;
    
    await submitFeedback(message, email, 'lizenz_anfrage');
    
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lizenzschlüssel anfordern">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center space-y-4">
            <div className="flex justify-center">
                <div className="bg-[var(--color-accent-secondary-transparent-50)] p-3 rounded-full">
                    <SparklesIcon className="w-10 h-10 text-[var(--color-accent-text)]" />
                </div>
            </div>
            <p className="text-[var(--color-text-secondary)]">
                Vielen Dank für Ihre Unterstützung! ❤️<br/>
                Damit wir Ihre Spende zuordnen und Ihren persönlichen Schlüssel erstellen können, benötigen wir folgende Angaben:
            </p>
        </div>

        <div className="space-y-4">
            <Input
                ref={nameInputRef}
                label="Ihr Wunsch-Name (Anrede in der App)"
                id="req-license-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Max Mustermann"
                required
            />
            
            <Input
                label="Name des PayPal-Kontoinhabers"
                id="req-license-payment-identity"
                value={paymentIdentity}
                onChange={(e) => setPaymentIdentity(e.target.value)}
                placeholder="Falls abweichend (z.B. Ehepartner)"
            />

            <Input
                label="Ihre E-Mail-Adresse (für den Versand)"
                id="req-license-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
                required
            />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!name.trim() || !email.trim() || isSubmitting}>
            {isSubmitting && <SpinnerIcon />}
            <span>Jetzt anfordern</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestLicenseModal;