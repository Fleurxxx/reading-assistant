import {
  BookMarked,
  BookOpen,
  Clock,
  Globe,
  Languages,
  RefreshCw,
  Settings,
  Star,
  TrendingUp,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { BarChart, LineChart } from "../components/FrequencyChart";
import { useTranslation } from "../i18n";
import type { ReadingStats, Word } from "../storage/db";
import { db } from "../storage/db";
import { statsRepository } from "../storage/statsRepository";
import { wordRepository } from "../storage/wordRepository";

interface StatsData {
  today: ReadingStats;
  recentStats: ReadingStats[];
  topWords: Word[];
  allTime: {
    totalWords: number;
    totalTranslations: number;
    totalReadingTime: number;
    totalDays: number;
    uniqueDomains: number;
  };
  totalVocabulary: number;
}

const StatsView: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [today, recentStats, topWords, allTime, totalVocabulary] = await Promise.all([
        statsRepository.getTodayStats(),
        statsRepository.getRecentStats(7),
        wordRepository.getTopWords(10),
        statsRepository.getAllTimeStats(),
        db.vocabulary.count(),
      ]);

      setStats({
        today,
        recentStats,
        topWords,
        allTime,
        totalVocabulary,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
      setError(t.stats.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.stats.loadError]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const openVocabulary = () => {
    chrome.runtime.openOptionsPage();
  };

  const openSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  if (loading) {
    return (
      <div className="w-[400px] h-[600px] bg-white dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{t.stats.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="w-[400px] h-[600px] bg-white dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error || t.stats.failedToLoad}
          </p>
          <button
            type="button"
            onClick={loadStats}
            className="mt-2 px-4 py-2 bg-sky-500 text-white text-sm rounded-lg hover:bg-sky-600 transition-colors"
          >
            {t.stats.retry}
          </button>
        </div>
      </div>
    );
  }

  // Prepare weekly trend data
  const weeklyLabels = stats.recentStats
    .slice()
    .reverse()
    .map((s) => {
      const date = new Date(s.date);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

  const weeklyWordsData = stats.recentStats
    .slice()
    .reverse()
    .map((s) => s.wordsCount);
  const weeklyTranslationsData = stats.recentStats
    .slice()
    .reverse()
    .map((s) => s.translationCount);

  return (
    <div className="w-[400px] max-h-[600px] bg-white dark:bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-sky-500 to-blue-600 text-white p-5 shadow-lg z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{t.stats.title}</h1>
            <p className="text-xs text-sky-100 mt-1">{t.stats.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openVocabulary}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={t.settings.title}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={loadStats}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={t.stats.refresh}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Today's Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label={t.stats.today.wordsToday}
            value={stats.today.wordsCount.toLocaleString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={<Languages className="w-5 h-5" />}
            label={t.stats.today.translations}
            value={stats.today.translationCount.toLocaleString()}
            color="bg-purple-500"
          />
          <StatCard
            icon={<Globe className="w-5 h-5" />}
            label={t.stats.today.sitesVisited}
            value={stats.today.domainsVisited.length.toString()}
            color="bg-green-500"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label={t.stats.today.readingTime}
            value={`${stats.today.readingTime}m`}
            color="bg-orange-500"
          />
        </div>

        {/* All-Time Stats */}
        {stats.allTime.totalDays > 1 && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t.stats.allTime.title}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-600 dark:text-gray-400">{t.stats.allTime.totalWords}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.allTime.totalWords.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">{t.stats.allTime.daysActive}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.allTime.totalDays}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">{t.stats.allTime.translations}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.allTime.totalTranslations.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">{t.stats.allTime.readingTime}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.allTime.totalReadingTime}m
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top Words Chart */}
        {stats.topWords.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t.stats.charts.topWords}
              </h2>
            </div>
            <BarChart
              labels={stats.topWords.map((w) => w.word)}
              data={stats.topWords.map((w) => w.count)}
              label={t.stats.charts.frequency}
              color="#0ea5e9"
              height={180}
            />
          </div>
        )}

        {/* Weekly Trend */}
        {stats.recentStats.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t.stats.charts.weeklyTrend}
              </h2>
            </div>
            <LineChart
              labels={weeklyLabels}
              datasets={[
                {
                  label: t.stats.charts.wordsRead,
                  data: weeklyWordsData,
                  color: "#0ea5e9",
                },
                {
                  label: t.stats.allTime.translations,
                  data: weeklyTranslationsData,
                  color: "#8b5cf6",
                },
              ]}
              height={180}
            />
          </div>
        )}

        {/* Vocabulary Stats */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t.stats.vocabulary.title}
              </h2>
            </div>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.totalVocabulary}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            {t.stats.vocabulary.savedWords}
          </p>
          <button
            type="button"
            onClick={openVocabulary}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {t.stats.vocabulary.viewList}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-2 pb-2">
          <button
            type="button"
            onClick={openSidePanel}
            className="py-3 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Languages className="w-4 h-4" />
            {t.stats.actions.openPanel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div
        className={`${color} w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3`}
      >
        {icon}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

export default StatsView;
