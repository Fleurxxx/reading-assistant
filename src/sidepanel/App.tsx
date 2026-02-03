import { BookMarked, Languages } from "lucide-react";
import { useEffect, useState } from "react";
import VocabularyList from "../components/VocabularyList";
import { useTranslation } from "../i18n";
import type { TranslationResult, Vocabulary } from "../storage/db";
import { addMessageListener, type Message, MessageType } from "../utils/messaging";
import TranslationView from "./TranslationView";

interface AppState {
  selectedText: string;
  translation: TranslationResult | null;
  isLoading: boolean;
  error: string | null;
}

type TabView = "translation" | "vocabulary";

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabView>("translation");
  const [state, setState] = useState<AppState>({
    selectedText: "",
    translation: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    // Listen for translation results from background
    addMessageListener((message: Message) => {
      if (message.type === MessageType.TRANSLATION_RESULT) {
        setState({
          selectedText: message.data.text,
          translation: message.data.result,
          isLoading: false,
          error: null,
        });
        // Auto-switch to translation tab when new translation arrives
        setActiveTab("translation");
      } else if (message.type === MessageType.TRANSLATION_ERROR) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message.data.error || "Translation failed",
        }));
        setActiveTab("translation");
      }
    });

    // Check if there's a pending translation on load
    chrome.storage.local.get(["pendingTranslation"], (result) => {
      if (result.pendingTranslation) {
        setState({
          selectedText: result.pendingTranslation.text,
          translation: result.pendingTranslation.result,
          isLoading: false,
          error: null,
        });
        // Clear pending translation
        chrome.storage.local.remove(["pendingTranslation"]);
        setActiveTab("translation");
      }
    });
  }, []);

  // Handle word selection from vocabulary list
  const handleWordSelect = (vocab: Vocabulary) => {
    // Switch to translation view and show the word details
    setState({
      selectedText: vocab.word,
      translation: {
        translation: vocab.translation,
        phonetic: vocab.pronunciation,
        examples: vocab.examples,
      },
      isLoading: false,
      error: null,
    });
    setActiveTab("translation");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("translation")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "translation"
                ? "border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-900/20"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Languages className="w-4 h-4" />
            {t.tabs.translation}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vocabulary")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "vocabulary"
                ? "border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-900/20"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <BookMarked className="w-4 h-4" />
            {t.tabs.vocabulary}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "translation" ? (
          <TranslationView
            selectedText={state.selectedText}
            translation={state.translation}
            isLoading={state.isLoading}
            error={state.error}
          />
        ) : (
          <VocabularyList onWordSelect={handleWordSelect} />
        )}
      </div>
    </div>
  );
}

export default App;
