import { BookmarkCheck, FileDown, Filter, Loader2, Search, Tag } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "../i18n";
import type { Vocabulary } from "../storage/db";
import { vocabularyRepository } from "../storage/vocabularyRepository";
import WordCard from "./WordCard";

interface VocabularyListProps {
  onWordSelect?: (word: Vocabulary) => void;
}

function VocabularyList({ onWordSelect }: VocabularyListProps) {
  const { t } = useTranslation();
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [masteryFilter, setMasteryFilter] = useState<"all" | "mastered" | "learning">("all");
  const [sortBy, setSortBy] = useState<"date" | "word">("date");
  const [showFilters, setShowFilters] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Load vocabulary and tags
  const loadVocabulary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vocabularyRepository.getAll();
      setVocabulary(data);

      const tags = await vocabularyRepository.getAllTags();
      setAllTags(tags);
    } catch (err) {
      console.error("Failed to load vocabulary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary]);

  // Filter and search vocabulary
  const filteredVocabulary = useMemo(() => {
    let result = [...vocabulary];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) => v.word.toLowerCase().includes(query) || v.translation.toLowerCase().includes(query)
      );
    }

    // Apply mastery filter
    if (masteryFilter !== "all") {
      result = result.filter((v) => v.mastered === (masteryFilter === "mastered"));
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      result = result.filter((v) => selectedTags.some((tag) => v.tags.includes(tag)));
    }

    // Sort
    if (sortBy === "date") {
      result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    } else {
      result.sort((a, b) => a.word.localeCompare(b.word));
    }

    return result;
  }, [vocabulary, searchQuery, masteryFilter, selectedTags, sortBy]);

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const csv = await vocabularyRepository.exportToCSV();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vocabulary_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV:", err);
    }
  };

  // Toggle tag filter
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Statistics
  const stats = useMemo(() => {
    const total = vocabulary.length;
    const mastered = vocabulary.filter((v) => v.mastered).length;
    const learning = total - mastered;
    return { total, mastered, learning };
  }, [vocabulary]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin mb-4" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{t.settings.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Stats */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t.vocabulary.title}
          </h1>
          <button
            type="button"
            onClick={exportToCSV}
            disabled={vocabulary.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to CSV"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {stats.total}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t.vocabulary.stats.total}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-green-700 dark:text-green-400">
              {stats.mastered}
            </div>
            <div className="text-xs text-green-600 dark:text-green-500">
              {t.vocabulary.stats.mastered}
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {stats.learning}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-500">Learning</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t.vocabulary.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showFilters || selectedTags.length > 0 || masteryFilter !== "all"
                ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {t.vocabulary.filter.all}
            {(selectedTags.length > 0 || masteryFilter !== "all") && (
              <span className="bg-sky-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {selectedTags.length + (masteryFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "word")}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="date">{t.vocabulary.sort.recent}</option>
            <option value="word">{t.vocabulary.sort.alphabetical}</option>
          </select>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            {/* Mastery Filter */}
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Mastery Status
              </p>
              <div className="flex gap-2">
                {(["all", "learning", "mastered"] as const).map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    onClick={() => setMasteryFilter(filter)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      masteryFilter === filter
                        ? "bg-sky-500 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Filter by Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-sky-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vocabulary List */}
      <div className="flex-1 overflow-y-auto sidepanel-scrollable">
        {filteredVocabulary.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <BookmarkCheck className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {searchQuery || selectedTags.length > 0 || masteryFilter !== "all"
                ? "No matches found"
                : t.vocabulary.empty}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              {searchQuery || selectedTags.length > 0 || masteryFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Start adding words by translating and saving them"}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredVocabulary.map((vocab) => (
              <WordCard
                key={vocab.id}
                vocabulary={vocab}
                onUpdate={loadVocabulary}
                onDelete={loadVocabulary}
                onClick={() => onWordSelect?.(vocab)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VocabularyList;
