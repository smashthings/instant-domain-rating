(function () {
  const LogLevel = {
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40
  };

  const CURRENT_LOG_LEVEL = LogLevel.WARN;

  function Log(message, level) {
    if (level < CURRENT_LOG_LEVEL) {
      return;
    }

    const levelName = Object.keys(LogLevel).find((key) => LogLevel[key] === level) || "INFO";
    const formattedMessage = `[${levelName}] ${new Date().toISOString()} - ${message}`;

    if (level === LogLevel.DEBUG) {
      console.debug(formattedMessage);
      return;
    }

    if (level === LogLevel.INFO) {
      console.info(formattedMessage);
      return;
    }

    if (level === LogLevel.WARN) {
      console.warn(formattedMessage);
      return;
    }

    console.error(formattedMessage);
  }

  const namespace = globalThis.TrulyAhrefs = globalThis.TrulyAhrefs || {};
  const StorageKey = "ahrefsApiKey";

  class PopupController {
    constructor() {
      this.statusPanel = document.getElementById("statusPanel");
      this.resultPanel = document.getElementById("resultPanel");
      this.emptyPanel = document.getElementById("emptyPanel");
      this.statusTitle = document.getElementById("statusTitle");
      this.statusMessage = document.getElementById("statusMessage");
      this.emptyTitle = document.getElementById("emptyTitle");
      this.emptyMessage = document.getElementById("emptyMessage");
      this.domainName = document.getElementById("domainName");
      this.domainRating = document.getElementById("domainRating");
      this.settingsButton = document.getElementById("settingsButton");
      this.configureButton = document.getElementById("configureButton");
    }

    async Init() {
      this.settingsButton.addEventListener("click", () => this.openOptionsPage());
      this.configureButton.addEventListener("click", () => this.openOptionsPage());

      try {
        this.showLoading("Checking current domain", "Waiting for Ahrefs to respond...");
        const apiKey = await this.getApiKey();
        if (!apiKey) {
          this.showEmpty("API key needed", "Add your Ahrefs API key in settings to check domain ratings.");
          return;
        }

        const domain = await this.getCurrentDomain();
        if (!domain) {
          this.showEmpty("No website detected", "Open the extension from a normal website tab.");
          return;
        }

        const result = await this.fetchAhrefsDomainRating(apiKey, domain);
        this.showResult(domain, result);
      } catch (error) {
        Log(error.message, LogLevel.ERROR);
        this.showEmpty("Could not load rating", error.message);
      }
    }

    async getApiKey() {
      const stored = await chrome.storage.sync.get(StorageKey);
      return stored[StorageKey] || "";
    }

    async getCurrentDomain() {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.url) {
        return "";
      }

      const url = new URL(activeTab.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "";
      }

      return url.hostname.replace(/^www\./i, "");
    }

    async fetchAhrefsDomainRating(apiKey, domain) {
      const ratingUrl = new URL("https://api.ahrefs.com/v3/public/domain-rating-free");
      ratingUrl.searchParams.set("target", domain);

      const ratingResponse = await this.fetchJson(ratingUrl, apiKey);
      const rating = ratingResponse.domain_rating || {};

      return {
        domainRating: rating.domain_rating
      };
    }

    async fetchJson(url, apiKey) {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        const detail = await this.readErrorDetail(response);
        throw new Error(detail || `Ahrefs returned HTTP ${response.status}`);
      }

      return response.json();
    }

    async readErrorDetail(response) {
      try {
        const data = await response.json();
        return data.error || data.message || "";
      } catch (error) {
        Log(error.message, LogLevel.DEBUG);
        return "";
      }
    }

    showLoading(title, message) {
      this.statusTitle.textContent = title;
      this.statusMessage.textContent = message;
      this.statusPanel.classList.remove("hidden");
      this.resultPanel.classList.add("hidden");
      this.emptyPanel.classList.add("hidden");
    }

    showResult(domain, result) {
      this.domainName.textContent = domain;
      this.domainRating.textContent = this.formatMetric(result.domainRating);
      this.statusPanel.classList.add("hidden");
      this.emptyPanel.classList.add("hidden");
      this.resultPanel.classList.remove("hidden");
    }

    showEmpty(title, message) {
      this.emptyTitle.textContent = title;
      this.emptyMessage.textContent = message;
      this.statusPanel.classList.add("hidden");
      this.resultPanel.classList.add("hidden");
      this.emptyPanel.classList.remove("hidden");
    }

    formatMetric(value) {
      if (value === undefined || value === null || value === "") {
        return "--";
      }

      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) {
        return String(value);
      }

      return new Intl.NumberFormat("en", {
        notation: numberValue >= 10000 ? "compact" : "standard",
        maximumFractionDigits: numberValue >= 10000 ? 1 : 0
      }).format(numberValue);
    }

    openOptionsPage() {
      chrome.runtime.openOptionsPage();
    }
  }

  namespace.PopupController = PopupController;

  document.addEventListener("DOMContentLoaded", () => {
    const controller = new PopupController();
    controller.Init();
  });
}());
