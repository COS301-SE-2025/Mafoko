import React from 'react';
import '../../styles/ConfirmationModal.scss';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay text-theme" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        <div className="modal-content text-theme">{children}</div>
        <div className="modal-actions">
          <button
            className="modal-btn modal-cancel text-black"
            onClick={onClose}
          >
            {t('learningPathPage.main.cancel')}
          </button>
          <button className="modal-btn modal-confirm" onClick={onConfirm}>
            {t('learningPathPage.main.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
