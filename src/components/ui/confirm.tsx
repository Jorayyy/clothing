'use client';

import { useState, type ReactNode } from 'react';

import { Button } from './button';
import { Modal } from './modal';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const isBusy = busy ?? pending;

  const handleConfirm = async () => {
    try {
      setPending(true);
      await onConfirm();
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={isBusy ? () => undefined : onCancel}
      title={title}
      size="sm"
      closeOnBackdrop={!isBusy}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'accent' : 'primary'}
            onClick={handleConfirm}
            disabled={isBusy}
          >
            {isBusy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-muted">{body}</div>
    </Modal>
  );
}
