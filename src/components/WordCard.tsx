import {
  Calendar,
  CheckCircle,
  ChevronDown,
  Circle,
  Edit2,
  Plus,
  Tag,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Vocabulary } from "../storage/db";
import { vocabularyRepository } from "../storage/vocabularyRepository";

interface WordCardProps {
  vocabulary: Vocabulary;
  onUpdate?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

function WordCard({ vocabulary, onUpdate, onDelete, onClick }: WordCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [localTags, setLocalTags] = useState<string[]>(vocabulary.tags);

  // Play pronunciation
  const playPronunciation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(vocabulary.word);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle mastery
  const toggleMastery = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!vocabulary.id) return;

    try {
      await vocabularyRepository.updateMastery(vocabulary.id, !vocabulary.mastered);
      onUpdate?.();
    } catch (err) {
      console.error("Failed to update mastery:", err);
    }
  };

  // Delete vocabulary
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!vocabulary.id || !confirm(`Delete "${vocabulary.word}"?`)) return;

    try {
      await vocabularyRepository.delete(vocabulary.id);
      onDelete?.();
    } catch (err) {
      console.error("Failed to delete vocabulary:", err);
    }
  };

  // Add tag
  const addTag = async () => {
    if (!newTag.trim() || !vocabulary.id) return;

    const tag = newTag.trim().toLowerCase();
    if (localTags.includes(tag)) {
      setNewTag("");
      return;
    }

    const updatedTags = [...localTags, tag];
    setLocalTags(updatedTags);
    setNewTag("");

    try {
      await vocabularyRepository.update(vocabulary.id, { tags: updatedTags });
      onUpdate?.();
    } catch (err) {
      console.error("Failed to add tag:", err);
      setLocalTags(localTags);
    }
  };

  // Remove tag
  const removeTag = async (tagToRemove: string) => {
    if (!vocabulary.id) return;

    const updatedTags = localTags.filter((t) => t !== tagToRemove);
    setLocalTags(updatedTags);

    try {
      await vocabularyRepository.update(vocabulary.id, { tags: updatedTags });
      onUpdate?.();
    } catch (err) {
      console.error("Failed to remove tag:", err);
      setLocalTags(localTags);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border transition-all ${
        vocabulary.mastered
          ? "border-green-200 dark:border-green-800/50"
          : "border-slate-200 dark:border-slate-700"
      } hover:shadow-md`}
    >
      {/* Card Header */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate cursor-pointer hover:text-sky-600 dark:hover:text-sky-400"
                onClick={onClick}
              >
                {vocabulary.word}
              </h3>
              {vocabulary.mastered && (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {vocabulary.translation}
            </p>
            {vocabulary.pronunciation && (
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                /{vocabulary.pronunciation}/
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={playPronunciation}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              title="Play pronunciation"
            >
              <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </button>
            <button
              onClick={toggleMastery}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              title={vocabulary.mastered ? "Mark as learning" : "Mark as mastered"}
            >
              {vocabulary.mastered ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Tags Section */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1.5">
            {localTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {localTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs rounded group"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                    {editingTags && (
                      <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => setEditingTags(!editingTags)}
              className="ml-auto p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
              title="Edit tags"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Tag Input */}
          {editingTags && (
            <div className="flex gap-1 mt-2">
              <input
                type="text"
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTag()}
                className="flex-1 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                onClick={addTag}
                disabled={!newTag.trim()}
                className="p-1 bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Add tag"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Examples Toggle */}
        {vocabulary.examples.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 mt-2 font-medium"
          >
            {expanded ? "Hide" : "Show"} Examples ({vocabulary.examples.length})
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Expanded Examples */}
      {expanded && vocabulary.examples.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-2 bg-slate-50 dark:bg-slate-700/30">
          {vocabulary.examples.map((example, index) => (
            <div
              key={index}
              className="text-xs p-2 bg-white dark:bg-slate-800 rounded border-l-2 border-sky-400 dark:border-sky-500"
            >
              <p className="text-slate-700 dark:text-slate-300 italic">{example}</p>
            </div>
          ))}
        </div>
      )}

      {/* Footer - Added Date */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <Calendar className="w-3 h-3" />
          Added {new Date(vocabulary.addedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

export default WordCard;
