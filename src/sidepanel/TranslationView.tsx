import {
  AlertCircle,
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  CheckCheck,
  Copy,
  Globe,
  Loader2,
  Volume2,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useTranslation } from "../i18n";
import type { TranslationResult } from "../storage/db";
import { vocabularyRepository } from "../storage/vocabularyRepository";
import { MessageType, sendMessage } from "../utils/messaging";

interface TranslationViewProps {
  selectedText: string;
  translation: TranslationResult | null;
  isLoading: boolean;
  error: string | null;
}

function TranslationView({ selectedText, translation, isLoading, error }: TranslationViewProps) {
  const { t } = useTranslation();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play pronunciation audio
  const playPronunciation = async () => {
    if (!selectedText || isPlayingAudio) return;

    try {
      setIsPlayingAudio(true);

      // Use Web Speech API or external TTS service
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(selectedText);
        utterance.lang = "en-US";
        utterance.rate = 0.8;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback: use Youdao TTS
        const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(selectedText)}&type=2`;

        if (audioRef.current) {
          audioRef.current.pause();
        }

        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => setIsPlayingAudio(false);
        await audioRef.current.play();
      }
    } catch (err) {
      console.error("Audio playback error:", err);
      setIsPlayingAudio(false);
    }
  };

  // Copy translation to clipboard
  const copyToClipboard = async () => {
    if (!translation?.translation) return;

    try {
      await navigator.clipboard.writeText(translation.translation);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  // Add to vocabulary
  const addToVocabulary = async () => {
    if (!selectedText || !translation || isSaved) return;

    try {
      // Check if already exists
      const exists = await vocabularyRepository.exists(selectedText.toLowerCase());

      if (exists) {
        setIsSaved(true);
        return;
      }

      await vocabularyRepository.addWord({
        word: selectedText,
        translation: translation.translation,
        examples: translation.examples || [],
        mastered: false,
        tags: [],
        pronunciation: translation.phonetic,
      });

      setIsSaved(true);

      // Send message to background to update stats
      sendMessage({
        type: MessageType.SAVE_VOCABULARY,
        data: { word: selectedText },
      });
    } catch (err) {
      console.error("Save vocabulary error:", err);
    }
  };

  // Check if word is already saved
  React.useEffect(() => {
    if (selectedText) {
      vocabularyRepository
        .exists(selectedText.toLowerCase())
        .then(setIsSaved)
        .catch(() => setIsSaved(false));
    }
  }, [selectedText]);

  // Empty state
  if (!selectedText && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {t.translation.noSelection}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          {t.translation.selectText}
        </p>
        <div className="mt-6 text-xs text-slate-400 dark:text-slate-500">
          <p>
            Tip: Use{" "}
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Ctrl+Shift+T</kbd>
          </p>
          <p className="mt-1">or right-click to translate</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{t.translation.loading}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {t.translation.error}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Main translation view
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t.tabs.translation}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto sidepanel-scrollable p-4 space-y-4">
        {/* Selected Text Card */}
        <div className="animate-slide-in bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Original Text
            </h2>
            <button
              type="button"
              onClick={playPronunciation}
              disabled={isPlayingAudio}
              className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                isPlayingAudio ? "animate-audio-pulse" : ""
              }`}
              title="Play pronunciation"
            >
              <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </button>
          </div>
          <p className="text-xl font-medium text-slate-800 dark:text-slate-100 mb-2">
            {selectedText}
          </p>
          {translation?.phonetic && (
            <p className="text-sm text-slate-500 dark:text-slate-400">/{translation.phonetic}/</p>
          )}
        </div>

        {/* Translation Card */}
        {translation && (
          <div className="animate-slide-in bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-sm border border-sky-200 dark:border-slate-600 p-4">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xs font-medium text-sky-700 dark:text-sky-300 uppercase tracking-wide flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Chinese Translation
              </h2>
              <button
                type="button"
                onClick={copyToClipboard}
                className="p-1.5 rounded-md hover:bg-white/50 dark:hover:bg-slate-600 transition-colors"
                title="Copy translation"
              >
                {isCopied ? (
                  <CheckCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                )}
              </button>
            </div>
            <p className="text-lg font-medium text-slate-800 dark:text-slate-100">
              {translation.translation}
            </p>
          </div>
        )}

        {/* Explanations */}
        {translation?.explains && translation.explains.length > 0 && (
          <div className="animate-slide-in bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Detailed Explanations
            </h2>
            <ul className="space-y-2">
              {translation.explains.map((explain) => (
                <li
                  key={explain}
                  className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                >
                  <span className="text-sky-500 dark:text-sky-400 mt-0.5">•</span>
                  <span>{explain}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Example Sentences */}
        {translation?.examples && translation.examples.length > 0 && (
          <div className="animate-slide-in bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Example Sentences
            </h2>
            <div className="space-y-3">
              {translation.examples.map((example) => (
                <div
                  key={example}
                  className="text-sm p-3 bg-slate-50 dark:bg-slate-700/50 rounded border-l-2 border-sky-400 dark:border-sky-500"
                >
                  <p className="text-slate-700 dark:text-slate-300 italic">{example}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Web Translations */}
        {translation?.webTranslations && translation.webTranslations.length > 0 && (
          <div className="animate-slide-in bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Web Translations
            </h2>
            <div className="space-y-2">
              {translation.webTranslations.map((web) => (
                <div key={web.key} className="text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{web.key}:</span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">
                    {web.value.join("; ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Action Buttons */}
      <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <button
          type="button"
          onClick={addToVocabulary}
          disabled={isSaved}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            isSaved
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
              : "bg-sky-500 hover:bg-sky-600 text-white shadow-sm hover:shadow"
          }`}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="w-5 h-5" />
              {t.vocabulary.actions.markMastered}
            </>
          ) : (
            <>
              <BookmarkPlus className="w-5 h-5" />
              {t.vocabulary.actions.star}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default TranslationView;
