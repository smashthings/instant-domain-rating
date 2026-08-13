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

  class OptionsController {
    constructor() {
      this.form = document.getElementById("settingsForm");
      this.input = document.getElementById("apiKeyInput");
      this.clearButton = document.getElementById("clearButton");
      this.saveMessage = document.getElementById("saveMessage");
    }

    async Init() {
      this.form.addEventListener("submit", (event) => this.handleSubmit(event));
      this.clearButton.addEventListener("click", () => this.clearKey());
      await this.loadApiKey();
    }

    async loadApiKey() {
      const stored = await chrome.storage.sync.get(StorageKey);
      this.input.value = stored[StorageKey] || "";
    }

    async handleSubmit(event) {
      event.preventDefault();
      const apiKey = this.input.value.trim();

      if (!apiKey) {
        this.setMessage("Enter an API key before saving.");
        return;
      }

      try {
        await chrome.storage.sync.set({ [StorageKey]: apiKey });
        this.setMessage("Saved. You can now check the current domain from the extension popup.");
      } catch (error) {
        Log(error.message, LogLevel.ERROR);
        this.setMessage("Could not save the API key.");
      }
    }

    async clearKey() {
      try {
        await chrome.storage.sync.remove(StorageKey);
        this.input.value = "";
        this.setMessage("API key cleared.");
      } catch (error) {
        Log(error.message, LogLevel.ERROR);
        this.setMessage("Could not clear the API key.");
      }
    }

    setMessage(message) {
      this.saveMessage.textContent = message;
    }
  }

  namespace.OptionsController = OptionsController;

  document.addEventListener("DOMContentLoaded", () => {
    const controller = new OptionsController();
    controller.Init();
  });
}());
