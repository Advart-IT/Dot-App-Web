import React from 'react';
import AppModal from './AppModal';
import { Button } from '../ui/button';

interface InfoPermissionModalProps {
  open: boolean;
  type: 'info' | 'confirm';
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}

const InfoPermissionModal: React.FC<InfoPermissionModalProps> = ({ open, type, message, onClose, onConfirm }) => {
  return (
    <AppModal open={open} onClose={onClose}>
      <div style={{ minWidth: 260 }}>
        <div className="mb-4 text-base text-gray-800 whitespace-pre-line">{message}</div>
        {type === 'confirm' ? (
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="default" onClick={onClose}>Cancel</Button>
            <Button variant="default" size="default" onClick={() => { if (onConfirm) onConfirm(); onClose(); }}>Confirm</Button>
          </div>
        ) : (
          <div className="flex justify-end mt-2">
            <Button variant="default" size="default" onClick={onClose}>OK</Button>
          </div>
        )}
      </div>
    </AppModal>
  );
};

export default InfoPermissionModal;
