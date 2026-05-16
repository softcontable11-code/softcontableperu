import React from 'react';
import { Save, Trash2 } from 'lucide-react';
import Button from './Button';

interface ActionBarProps {
  onSave: () => void;
  onClear: () => void;
  saveLabel?: string;
  clearLabel?: string;
  saveDisabled?: boolean;
  extraActions?: React.ReactNode;
  statusLeft?: React.ReactNode;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onSave,
  onClear,
  saveLabel = 'Guardar',
  clearLabel = 'Limpiar',
  saveDisabled,
  extraActions,
  statusLeft,
}) => (
  <div className="action-bar">
    {statusLeft && <div className="flex-1 min-w-0">{statusLeft}</div>}
    {!statusLeft && <div className="flex-1" />}
    <div className="flex items-center gap-2">
      {extraActions}
      <Button
        variant="danger"
        size="md"
        icon={<Trash2 size={15} />}
        onClick={onClear}
      >
        {clearLabel}
      </Button>
      <Button
        variant="primary"
        size="lg"
        icon={<Save size={15} />}
        onClick={onSave}
        disabled={saveDisabled}
      >
        {saveLabel}
      </Button>
    </div>
  </div>
);

export default ActionBar;
