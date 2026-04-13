import React, { useState } from 'react';
import { SpeakerProfile } from '../services/speakerService';

interface SpeakerSetupProps {
  speakers: SpeakerProfile[];
  onRegisterSpeaker: (name: string) => void;
  onRemoveSpeaker: (speakerId: string) => void;
  onClose?: () => void;
}

const SpeakerSetup: React.FC<SpeakerSetupProps> = ({
  speakers,
  onRegisterSpeaker,
  onRemoveSpeaker,
  onClose,
}) => {
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleAddSpeaker = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpeakerName.trim()) {
      onRegisterSpeaker(newSpeakerName.trim());
      setNewSpeakerName('');
      setShowForm(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🎙️</span>
            Speaker Identification Setup
          </h2>
          <p className="text-orange-100 text-sm mt-1">
            Register speakers to automatically identify who's speaking during your meetings
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Speakers List */}
          {speakers.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Registered Speakers ({speakers.length})
              </h3>
              <div className="space-y-2">
                {speakers.map((speaker) => (
                  <div
                    key={speaker.id}
                    className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: speaker.color }}
                      />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {speaker.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {speaker.samples > 0
                            ? `${speaker.samples} samples • Pitch: ${speaker.fundamentalFrequency} Hz`
                            : 'Awaiting training samples'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveSpeaker(speaker.id)}
                      className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Speaker Form */}
          {showForm ? (
            <form onSubmit={handleAddSpeaker} className="space-y-4 mb-6 p-4 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Speaker Name
                </label>
                <input
                  type="text"
                  value={newSpeakerName}
                  onChange={(e) => setNewSpeakerName(e.target.value)}
                  placeholder="e.g., John Smith"
                  autoFocus
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition"
                >
                  Register Speaker
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-400 dark:hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition mb-6 flex items-center justify-center gap-2"
            >
              <span>+</span>
              Add Speaker
            </button>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
              📋 How Speaker Identification Works:
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-500 space-y-1 list-disc list-inside">
              <li>Each speaker has unique voice characteristics (pitch, tone)</li>
              <li>During recording, AudioMax analyzes audio in real-time</li>
              <li>The system automatically identifies who's speaking</li>
              <li>Speaker profiles improve with more audio samples</li>
              <li>Each speaker gets a unique color in transcripts</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakerSetup;
