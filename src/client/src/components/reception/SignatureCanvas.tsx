import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import { Button } from '../ui/button';
import { RefreshCw, Check } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
  error?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureChange,
  error,
}) => {
  const signaturePadRef = useRef<SignaturePad>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
      onSignatureChange('');
    }
  };

  const handleEnd = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signature = signaturePadRef.current.toDataURL('image/png');
      setIsEmpty(false);
      onSignatureChange(signature);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Firma del Cliente <span className="text-red-500">*</span>
      </label>

      <div
        className={`border-2 rounded-lg overflow-hidden bg-white ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <SignaturePad
          ref={signaturePadRef}
          canvasProps={{
            className: 'w-full h-48 touch-none',
            style: { touchAction: 'none' },
          }}
          onEnd={handleEnd}
          backgroundColor="rgb(255, 255, 255)"
          penColor="rgb(0, 0, 0)"
          minWidth={1}
          maxWidth={3}
          velocityFilterWeight={0.7}
          throttle={16}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          className="flex-1 h-14 text-base"
          disabled={isEmpty}
        >
          <RefreshCw className="mr-2 h-5 w-5" />
          Limpiar Firma
        </Button>

        {!isEmpty && (
          <div className="flex items-center gap-2 text-green-600 px-4">
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">Firmado</span>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Por favor, firme en el recuadro de arriba usando su dedo o stylus
      </p>
    </div>
  );
};
