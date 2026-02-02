import { Monitor, Moon, Plus, RotateCcw, Save, Settings, Sun } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { type AppSettings, DEFAULT_SETTINGS, STORAGE_KEYS } from "../utils/constants";

interface APICredentials {
  appKey: string;
  appSecret: string;
}

const SettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [credentials, setCredentials] = useState<APICredentials>({ appKey: "", appSecret: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Domain input states
  const [blacklistInput, setBlacklistInput] = useState("");
  const [whitelistInput, setWhitelistInput] = useState("");

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const loadSettings = async () => {
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
      showMessage("error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: settings,
        [STORAGE_KEYS.API_CREDENTIALS]: credentials,
      });

      showMessage("success", "Settings saved successfully!");

      // Apply theme immediately
      applyTheme(settings.theme);
    } catch (error) {
      console.error("Failed to save settings:", error);
      showMessage("error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings(DEFAULT_SETTINGS);
      setCredentials({ appKey: "", appSecret: "" });
      showMessage("success", "Settings reset to defaults");
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
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
      showMessage("error", "Invalid domain format. Use domain.com or *.domain.com");
      return;
    }

    const domains = type === "blacklist" ? settings.blacklistDomains : settings.whitelistDomains;

    if (domains.includes(input.trim())) {
      showMessage("error", "Domain already exists");
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

    showMessage("success", "Settings exported successfully");
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
            showMessage("success", "Settings imported successfully");
          } else {
            showMessage("error", "Invalid settings file");
          }
        } catch (_error) {
          showMessage("error", "Failed to parse settings file");
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
          <div className="text-lg">Loading settings...</div>
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
            <h1 className="text-3xl font-bold">English Reading Assistant</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure your reading enhancement preferences
            </p>
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
        <h2 className="section-title">General Settings</h2>

        <div className="form-group">
          <div className="toggle-container">
            <div>
              <label className="form-label">Auto Analysis</label>
              <span className="form-description">
                Automatically analyze text on pages you visit
              </span>
            </div>
            <label className="toggle-switch">
              <input
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
              <label className="form-label">Enable Keyboard Shortcuts</label>
              <span className="form-description">
                Use keyboard shortcuts for quick translation
                <span className="shortcut-key">Ctrl+Shift+T</span> (Mac:{" "}
                <span className="shortcut-key">Cmd+Shift+T</span>)
              </span>
            </div>
            <label className="toggle-switch">
              <input
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
        <h2 className="section-title">Appearance</h2>

        <div className="form-group">
          <label className="form-label">Theme</label>
          <div className="flex gap-3 mt-2">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                settings.theme === "light"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onClick={() => setSettings({ ...settings, theme: "light" })}
            >
              <Sun className="w-5 h-5" />
              Light
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                settings.theme === "dark"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onClick={() => setSettings({ ...settings, theme: "dark" })}
            >
              <Moon className="w-5 h-5" />
              Dark
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                settings.theme === "auto"
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onClick={() => setSettings({ ...settings, theme: "auto" })}
            >
              <Monitor className="w-5 h-5" />
              Auto
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Font Size
            <span className="range-value">{settings.fontSize}px</span>
          </label>
          <input
            type="range"
            min="12"
            max="20"
            value={settings.fontSize}
            onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value, 10) })}
            className="range-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Side Panel Position</label>
          <select
            className="form-select"
            value={settings.sidePanelPosition}
            onChange={(e) =>
              setSettings({ ...settings, sidePanelPosition: e.target.value as "left" | "right" })
            }
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      {/* Domain Management */}
      <div className="options-section">
        <h2 className="section-title">Domain Management</h2>

        <div className="form-group">
          <label className="form-label">Blacklist Domains</label>
          <span className="form-description">
            Disable word analysis on these domains (e.g., github.com or *.google.com)
          </span>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              className="form-input"
              placeholder="example.com or *.example.com"
              value={blacklistInput}
              onChange={(e) => setBlacklistInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addDomain("blacklist")}
            />
            <button className="btn btn-primary" onClick={() => addDomain("blacklist")}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {settings.blacklistDomains.length > 0 && (
            <div className="domain-list">
              {settings.blacklistDomains.map((domain) => (
                <div key={domain} className="domain-item">
                  <span>{domain}</span>
                  <span className="domain-remove" onClick={() => removeDomain("blacklist", domain)}>
                    Remove
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Whitelist Domains</label>
          <span className="form-description">
            Only analyze text on these domains (leave empty to analyze all)
          </span>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              className="form-input"
              placeholder="example.com or *.example.com"
              value={whitelistInput}
              onChange={(e) => setWhitelistInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addDomain("whitelist")}
            />
            <button className="btn btn-primary" onClick={() => addDomain("whitelist")}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {settings.whitelistDomains.length > 0 && (
            <div className="domain-list">
              {settings.whitelistDomains.map((domain) => (
                <div key={domain} className="domain-item">
                  <span>{domain}</span>
                  <span className="domain-remove" onClick={() => removeDomain("whitelist", domain)}>
                    Remove
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Configuration */}
      <div className="options-section">
        <h2 className="section-title">Translation API</h2>

        <div className="credentials-warning">
          <strong>Note:</strong> Youdao API credentials are required for translation features. Get
          your API keys from{" "}
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
          <label className="form-label">App Key</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter your Youdao App Key"
            value={credentials.appKey}
            onChange={(e) => setCredentials({ ...credentials, appKey: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">App Secret</label>
          <input
            type="password"
            className="form-input"
            placeholder="Enter your Youdao App Secret"
            value={credentials.appSecret}
            onChange={(e) => setCredentials({ ...credentials, appSecret: e.target.value })}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="options-section">
        <h2 className="section-title">Advanced</h2>

        <div className="form-group">
          <label className="form-label">Export Settings</label>
          <span className="form-description">Export your settings to a JSON file for backup</span>
          <button className="btn btn-secondary mt-2" onClick={exportSettings}>
            Export Settings
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Import Settings</label>
          <span className="form-description">Import settings from a previously exported file</span>
          <button className="btn btn-secondary mt-2" onClick={importSettings}>
            Import Settings
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="button-group">
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={saveSettings}
          disabled={saving}
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>

        <button
          className="btn btn-secondary flex items-center gap-2"
          onClick={resetSettings}
          disabled={saving}
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default SettingsForm;
