import { Globe, Monitor, Moon, Plus, RotateCcw, Save, Settings, Sun } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "../i18n";
import { type AppSettings, DEFAULT_SETTINGS, STORAGE_KEYS } from "../utils/constants";

interface APICredentials {
  appKey: string;
  appSecret: string;
}

const SettingsForm: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [credentials, setCredentials] = useState<APICredentials>({ appKey: "", appSecret: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Domain input states
  const [blacklistInput, setBlacklistInput] = useState("");
  const [whitelistInput, setWhitelistInput] = useState("");

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.API_CREDENTIALS,
      ]);

      if (result[STORAGE_KEYS.SETTINGS]) {
        setSettings({ ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] });
      }

      if (result[STORAGE_KEYS.API_CREDENTIALS]) {
        setCredentials(result[STORAGE_KEYS.API_CREDENTIALS]);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      showMessage("error", t.settings.loadError);
    } finally {
      setLoading(false);
    }
  }, [showMessage, t.settings.loadError]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const normalizedCredentials = {
        appKey: credentials.appKey.trim(),
        appSecret: credentials.appSecret.trim(),
      };
      setCredentials(normalizedCredentials);

      await chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: settings,
        [STORAGE_KEYS.API_CREDENTIALS]: normalizedCredentials,
      });

      showMessage("success", t.settings.saveSuccess);

      // Apply theme immediately
      applyTheme(settings.theme);
    } catch (error) {
      console.error("Failed to save settings:", error);
      showMessage("error", t.settings.saveError);
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (confirm(t.settings.resetConfirm)) {
      setSettings(DEFAULT_SETTINGS);
      setCredentials({ appKey: "", appSecret: "" });
      showMessage("success", t.settings.resetSuccess);
    }
  };

  const applyTheme = (theme: "light" | "dark" | "auto") => {
    const root = document.documentElement;

    if (theme === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  };

  const addDomain = (type: "blacklist" | "whitelist") => {
    const input = type === "blacklist" ? blacklistInput : whitelistInput;
    const setInput = type === "blacklist" ? setBlacklistInput : setWhitelistInput;

    if (!input.trim()) return;

    // Basic domain validation
    const domainPattern = /^([a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}|\*)$/i;
    if (!domainPattern.test(input.trim())) {
      showMessage("error", t.domain.invalidFormat);
      return;
    }

    const domains = type === "blacklist" ? settings.blacklistDomains : settings.whitelistDomains;

    if (domains.includes(input.trim())) {
      showMessage("error", t.domain.alreadyExists);
      return;
    }

    setSettings({
      ...settings,
      [type === "blacklist" ? "blacklistDomains" : "whitelistDomains"]: [...domains, input.trim()],
    });

    setInput("");
  };

  const removeDomain = (type: "blacklist" | "whitelist", domain: string) => {
    const key = type === "blacklist" ? "blacklistDomains" : "whitelistDomains";
    setSettings({
      ...settings,
      [key]: settings[key].filter((d) => d !== domain),
    });
  };

  const exportSettings = () => {
    const data = {
      settings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `era-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showMessage("success", t.settings.exportSuccess);
  };

  const importSettings = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.settings) {
            setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
            showMessage("success", t.settings.importSuccess);
          } else {
            showMessage("error", t.settings.invalidFile);
          }
        } catch (_error) {
          showMessage("error", t.settings.parseError);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  if (loading) {
    return (
      <div className="options-container">
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">{t.settings.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="options-container">
      <div className="options-header">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-sky-500" />
          <div>
            <h1 className="text-3xl font-bold">{t.settings.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t.settings.description}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={message.type === "success" ? "success-message" : "error-message"}>
          {message.text}
        </div>
      )}

      {/* General Settings */}
      <div className="options-section">
        <h2 className="section-title">{t.general.title}</h2>

        <div className="form-group">
          <div className="toggle-container">
            <div>
              <label className="form-label" htmlFor="autoAnalysis-toggle">
                {t.general.autoAnalysis.label}
              </label>
              <span className="form-description">{t.general.autoAnalysis.description}</span>
            </div>
            <label className="toggle-switch">
              <input
                id="autoAnalysis-toggle"
                type="checkbox"
                className="toggle-input"
                checked={settings.autoAnalysis}
                onChange={(e) => setSettings({ ...settings, autoAnalysis: e.target.checked })}
              />
              <span className="toggle-slider round"></span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <div className="toggle-container">
            <div>
              <label className="form-label" htmlFor="shortcuts-toggle">
                {t.general.shortcuts.label}
              </label>
              <span className="form-description">
                {t.general.shortcuts.description}
                <span className="shortcut-key">Ctrl+Shift+T</span> (Mac:{" "}
                <span className="shortcut-key">Cmd+Shift+T</span>)
              </span>
            </div>
            <label className="toggle-switch">
              <input
                id="shortcuts-toggle"
                type="checkbox"
                className="toggle-input"
                checked={settings.enableShortcuts}
                onChange={(e) => setSettings({ ...settings, enableShortcuts: e.target.checked })}
              />
              <span className="toggle-slider round"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="options-section">
        <h2 className="section-title">{t.appearance.title}</h2>

        <div className="form-group">
          <p className="form-label">{t.appearance.theme.label}</p>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                settings.theme === "light"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onClick={() => setSettings({ ...settings, theme: "light" })}
            >
              <Sun className="w-5 h-5" />
              {t.appearance.theme.light}
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                settings.theme === "dark"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onClick={() => setSettings({ ...settings, theme: "dark" })}
            >
              <Moon className="w-5 h-5" />
              {t.appearance.theme.dark}
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                settings.theme === "auto"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onClick={() => setSettings({ ...settings, theme: "auto" })}
            >
              <Monitor className="w-5 h-5" />
              {t.appearance.theme.auto}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="font-size-range">
            {t.appearance.fontSize.label}
            <span className="range-value">{settings.fontSize}px</span>
          </label>
          <input
            id="font-size-range"
            type="range"
            min="12"
            max="20"
            value={settings.fontSize}
            onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value, 10) })}
            className="range-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="sidepanel-position">
            {t.appearance.sidePanelPosition.label}
          </label>
          <select
            id="sidepanel-position"
            className="form-select"
            value={settings.sidePanelPosition}
            onChange={(e) =>
              setSettings({ ...settings, sidePanelPosition: e.target.value as "left" | "right" })
            }
          >
            <option value="left">{t.appearance.sidePanelPosition.left}</option>
            <option value="right">{t.appearance.sidePanelPosition.right}</option>
          </select>
        </div>

        <div className="form-group">
          <p className="form-label">{t.appearance.language.label}</p>
          <span className="form-description">{t.appearance.language.description}</span>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                settings.language === "zh"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onClick={() => setSettings({ ...settings, language: "zh" })}
            >
              <Globe className="w-5 h-5" />
              {t.appearance.language.zh}
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                settings.language === "en"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onClick={() => setSettings({ ...settings, language: "en" })}
            >
              <Globe className="w-5 h-5" />
              {t.appearance.language.en}
            </button>
          </div>
        </div>
      </div>

      {/* Domain Management */}
      <div className="options-section">
        <h2 className="section-title">{t.domain.title}</h2>

        <div className="form-group">
          <label className="form-label" htmlFor="blacklist-input">
            {t.domain.blacklist.label}
          </label>
          <span className="form-description">{t.domain.blacklist.description}</span>
          <div className="flex gap-2 mt-2">
            <input
              id="blacklist-input"
              type="text"
              className="form-input"
              placeholder={t.domain.blacklist.placeholder}
              value={blacklistInput}
              onChange={(e) => setBlacklistInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addDomain("blacklist")}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => addDomain("blacklist")}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {settings.blacklistDomains.length > 0 && (
            <div className="domain-list">
              {settings.blacklistDomains.map((domain) => (
                <div key={domain} className="domain-item">
                  <span>{domain}</span>
                  <button
                    type="button"
                    className="domain-remove"
                    onClick={() => removeDomain("blacklist", domain)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        removeDomain("blacklist", domain);
                      }
                    }}
                  >
                    {t.domain.remove}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="whitelist-input">
            {t.domain.whitelist.label}
          </label>
          <span className="form-description">{t.domain.whitelist.description}</span>
          <div className="flex gap-2 mt-2">
            <input
              id="whitelist-input"
              type="text"
              className="form-input"
              placeholder={t.domain.whitelist.placeholder}
              value={whitelistInput}
              onChange={(e) => setWhitelistInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addDomain("whitelist")}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => addDomain("whitelist")}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {settings.whitelistDomains.length > 0 && (
            <div className="domain-list">
              {settings.whitelistDomains.map((domain) => (
                <div key={domain} className="domain-item">
                  <span>{domain}</span>
                  <button
                    type="button"
                    className="domain-remove"
                    onClick={() => removeDomain("whitelist", domain)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        removeDomain("whitelist", domain);
                      }
                    }}
                  >
                    {t.domain.remove}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Configuration */}
      <div className="options-section">
        <h2 className="section-title">{t.api.title}</h2>

        <div className="credentials-warning">
          <strong>{t.api.note}</strong> {t.api.noteLink}{" "}
          <a
            href="https://ai.youdao.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="help-link"
          >
            Youdao AI Platform
          </a>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="appkey-input">
            {t.api.appKey.label}
          </label>
          <input
            id="appkey-input"
            type="text"
            className="form-input"
            placeholder={t.api.appKey.placeholder}
            value={credentials.appKey}
            onChange={(e) => setCredentials({ ...credentials, appKey: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="appsecret-input">
            {t.api.appSecret.label}
          </label>
          <input
            id="appsecret-input"
            type="password"
            className="form-input"
            placeholder={t.api.appSecret.placeholder}
            value={credentials.appSecret}
            onChange={(e) => setCredentials({ ...credentials, appSecret: e.target.value })}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="options-section">
        <h2 className="section-title">{t.advanced.title}</h2>

        <div className="form-group">
          <p className="form-label">{t.advanced.export.label}</p>
          <span className="form-description">{t.advanced.export.description}</span>
          <button className="btn btn-secondary mt-2" type="button" onClick={exportSettings}>
            {t.advanced.export.button}
          </button>
        </div>

        <div className="form-group">
          <p className="form-label">{t.advanced.import.label}</p>
          <span className="form-description">{t.advanced.import.description}</span>
          <button className="btn btn-secondary mt-2" type="button" onClick={importSettings}>
            {t.advanced.import.button}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="button-group">
        <button
          type="button"
          className="btn btn-primary flex items-center gap-2"
          onClick={saveSettings}
          disabled={saving}
        >
          <Save className="w-4 h-4" />
          {saving ? t.settings.saving : t.actions.save}
        </button>

        <button
          type="button"
          className="btn btn-secondary flex items-center gap-2"
          onClick={resetSettings}
          disabled={saving}
        >
          <RotateCcw className="w-4 h-4" />
          {t.actions.reset}
        </button>
      </div>
    </div>
  );
};

export default SettingsForm;
