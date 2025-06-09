import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setError(null);
      setIsScanning(false);

      // Check for camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      setHasPermission(true);
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());

      // Initialize the barcode reader
      codeReader.current = new BrowserMultiFormatReader();
      
      // Start scanning
      startScanning();
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported on this device.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
    }
  };

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);

      const result = await codeReader.current.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            onScan(barcode);
            onClose();
          }
          if (error && !(error.name === 'NotFoundException')) {
            console.error('Scanning error:', error);
          }
        }
      );
    } catch (err) {
      console.error('Scanning start error:', err);
      setError('Failed to start scanning. Please try again.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      try {
        codeReader.current.stopContinuousDecode();
      } catch (error) {
        console.log('Scanner already stopped');
      }
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
              {hasPermission === false && (
                <Button 
                  onClick={initializeScanner}
                  className="mt-2 text-xs"
                  variant="outline"
                >
                  Try Again
                </Button>
              )}
            </div>
          )}

          {hasPermission === true && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-md object-cover"
                playsInline
              />
              
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-green-500 w-48 h-32 relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasPermission === null && !error && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Initializing camera...</span>
            </div>
          )}

          <div className="text-sm text-gray-600 text-center">
            {isScanning ? (
              <p>Point your camera at a barcode to scan</p>
            ) : (
              <p>Position the barcode within the camera view</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}