import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { saveScenario, updateScenario } from '../lib/scenarioApi';
import type { ScenarioType } from '../lib/types';
import './SaveScenarioBar.css';

export interface SaveScenarioBarProps {
  type: ScenarioType;
  input: Record<string, unknown>;
  result: Record<string, unknown> | null;
  placeholder?: string;
  /** If set, this scenario was reopened from the dashboard — the bar
   * offers "Update this plan" instead of always creating a duplicate. */
  existingScenarioId?: string;
  existingLabel?: string;
}

export function SaveScenarioBar({
  type,
  input,
  result,
  placeholder = 'Name this plan',
  existingScenarioId,
  existingLabel,
}: SaveScenarioBarProps) {
  const { status: authStatus } = useAuth();
  const [label, setLabel] = useState(existingLabel ?? '');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  // Lets someone reopen a saved plan, tweak it, and deliberately save
  // it as a separate new plan instead of overwriting the original.
  const [saveAsNew, setSaveAsNew] = useState(false);

  if (!result) return null;

  const isEditing = Boolean(existingScenarioId) && !saveAsNew;

  async function handleSave() {
    if (!result || !label.trim()) return;
    setSaveState('saving');
    try {
      if (isEditing && existingScenarioId) {
        await updateScenario(existingScenarioId, { type, label: label.trim(), input, result });
      } else {
        await saveScenario({ type, label: label.trim(), input, result });
        setLabel('');
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
    }
  }

  return (
    <div className="save-scenario-bar">
      {authStatus === 'signed-in' ? (
        <>
          <input
            type="text"
            placeholder={placeholder}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="save-scenario-bar__input"
          />
          <button
            onClick={handleSave}
            disabled={!label.trim() || saveState === 'saving'}
            className="save-scenario-bar__button"
          >
            {saveState === 'saving'
              ? 'Saving…'
              : saveState === 'saved'
              ? (isEditing ? 'Updated ✓' : 'Saved ✓')
              : (isEditing ? 'Update this plan' : 'Save this plan')}
          </button>
          {existingScenarioId && !saveAsNew && (
            <button
              type="button"
              className="save-scenario-bar__link"
              onClick={() => {
                setSaveAsNew(true);
                setLabel('');
              }}
            >
              Save as a new plan instead
            </button>
          )}
          {saveState === 'error' && (
            <p className="save-scenario-bar__error">
              This entry couldn't be saved. Try again.
            </p>
          )}
        </>
      ) : (
        <p className="save-scenario-bar__prompt">
          <Link to="/auth">Sign in</Link> to save this plan and come back to it later.
        </p>
      )}
    </div>
  );
}
