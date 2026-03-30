(function () {
  const $ = (sel) => document.querySelector(sel);
  const logEl = $("#log");
  const STORAGE_KEY = "kafka-producer-ui";

  // --- LocalStorage ---
  function saveState() {
    const state = {
      brokers: $("#brokers").value,
      clientId: $("#clientId").value,
      topic: $("#topic").value,
      msgKey: $("#msgKey").value,
      msgValue: $("#msgValue").value,
      msgHeaders: $("#msgHeaders").value,
      msgCount: $("#msgCount").value,
      intervalMs: $("#intervalMs").value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.brokers) $("#brokers").value = state.brokers;
      if (state.clientId) $("#clientId").value = state.clientId;
      if (state.topic) $("#topic").value = state.topic;
      if (state.msgKey) $("#msgKey").value = state.msgKey;
      if (state.msgValue) $("#msgValue").value = state.msgValue;
      if (state.msgHeaders) $("#msgHeaders").value = state.msgHeaders;
      if (state.msgCount) $("#msgCount").value = state.msgCount;
      if (state.intervalMs) $("#intervalMs").value = state.intervalMs;
    } catch {}
  }

  // Auto-save on input changes
  document.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", saveState);
  });

  // --- Logging ---
  function log(msg, type = "info") {
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.prepend(entry);
  }

  // --- API helper ---
  async function api(method, path, body) {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // --- Parse message fields ---
  function getMessagePayload() {
    const topic = $("#topic").value.trim();
    const key = $("#msgKey").value.trim() || undefined;
    let value = $("#msgValue").value.trim();
    const headersRaw = $("#msgHeaders").value.trim();

    if (!topic) throw new Error("Topic is required");
    if (!value) throw new Error("Value is required");

    // Try to parse value as JSON, otherwise send as string
    try {
      value = JSON.parse(value);
    } catch {}

    let headers;
    if (headersRaw) {
      try {
        headers = JSON.parse(headersRaw);
      } catch {
        throw new Error("Headers must be valid JSON");
      }
    }

    return { topic, key, value, headers };
  }

  // --- Connection ---
  let isConnected = false;

  function updateConnectionUI(state) {
    const statusEl = $("#connectionStatus");
    if (state === "connected") {
      isConnected = true;
      statusEl.textContent = "Connected";
      statusEl.className = "status connected";
      $("#btnConnect").disabled = true;
      $("#btnDisconnect").disabled = false;
    } else if (state === "connecting") {
      statusEl.textContent = "Connecting...";
      statusEl.className = "status connecting";
      $("#btnConnect").disabled = true;
      $("#btnDisconnect").disabled = true;
    } else {
      isConnected = false;
      statusEl.textContent = "Disconnected";
      statusEl.className = "status disconnected";
      $("#btnConnect").disabled = false;
      $("#btnDisconnect").disabled = true;
    }
  }

  $("#btnConnect").addEventListener("click", async () => {
    const brokers = $("#brokers").value.trim();
    const clientId = $("#clientId").value.trim();
    if (!brokers) {
      log("Brokers field is required", "error");
      return;
    }
    updateConnectionUI("connecting");
    try {
      await api("POST", "/connect", { brokers, clientId });
      updateConnectionUI("connected");
      log("Connected to Kafka", "success");
    } catch (err) {
      updateConnectionUI("disconnected");
      log(`Connection failed: ${err.message}`, "error");
    }
  });

  $("#btnDisconnect").addEventListener("click", async () => {
    try {
      await api("POST", "/disconnect");
      updateConnectionUI("disconnected");
      log("Disconnected", "info");
      $("#activeIntervals").innerHTML = "";
    } catch (err) {
      log(`Disconnect error: ${err.message}`, "error");
    }
  });

  // --- Tabs ---
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      $(`#tab-${tab.dataset.tab}`).classList.add("active");
    });
  });

  // --- Send Single ---
  $("#btnSendSingle").addEventListener("click", async () => {
    try {
      const payload = getMessagePayload();
      await api("POST", "/produce/single", payload);
      log(`Sent 1 message to "${payload.topic}"`, "success");
    } catch (err) {
      log(`Single send error: ${err.message}`, "error");
    }
  });

  // --- Send Count ---
  $("#btnSendCount").addEventListener("click", async () => {
    try {
      const payload = getMessagePayload();
      const count = parseInt($("#msgCount").value, 10);
      if (isNaN(count) || count < 1) throw new Error("Invalid count");
      await api("POST", "/produce/count", { ...payload, count });
      log(`Sent ${count} messages to "${payload.topic}"`, "success");
    } catch (err) {
      log(`Batch send error: ${err.message}`, "error");
    }
  });

  // --- Interval ---
  function addIntervalUI(id, intervalMs, topic) {
    const container = $("#activeIntervals");
    const item = document.createElement("div");
    item.className = "interval-item";
    item.id = `iv-${id}`;
    item.innerHTML = `
      <span>${id} — ${topic} every ${intervalMs}ms</span>
      <button class="btn btn-danger" onclick="window._stopInterval('${id}')">Stop</button>
    `;
    container.appendChild(item);
  }

  window._stopInterval = async (id) => {
    try {
      const result = await api("POST", "/produce/interval/stop", {
        intervalId: id,
      });
      log(`Stopped ${id} (sent ${result.sentCount} messages)`, "info");
      const el = $(`#iv-${id}`);
      if (el) el.remove();
    } catch (err) {
      log(`Stop interval error: ${err.message}`, "error");
    }
  };

  $("#btnStartInterval").addEventListener("click", async () => {
    try {
      const payload = getMessagePayload();
      const intervalMs = parseInt($("#intervalMs").value, 10);
      if (isNaN(intervalMs) || intervalMs < 100)
        throw new Error("Interval must be at least 100ms");
      const result = await api("POST", "/produce/interval", {
        ...payload,
        intervalMs,
      });
      log(
        `Started interval ${result.intervalId}: every ${intervalMs}ms to "${payload.topic}"`,
        "success",
      );
      addIntervalUI(result.intervalId, intervalMs, payload.topic);
    } catch (err) {
      log(`Interval start error: ${err.message}`, "error");
    }
  });

  $("#btnStopAllIntervals").addEventListener("click", async () => {
    try {
      await api("POST", "/produce/interval/stop", {});
      log("Stopped all intervals", "info");
      $("#activeIntervals").innerHTML = "";
    } catch (err) {
      log(`Stop all error: ${err.message}`, "error");
    }
  });

  // --- Clear log ---
  $("#btnClearLog").addEventListener("click", () => {
    logEl.innerHTML = "";
  });

  // --- Template variables reference ---
  const VAR_CATEGORIES = {
    IDs: ["uuid", "loanId", "applicationId"],
    Person: [
      "firstName",
      "lastName",
      "fullName",
      "email",
      "phone",
      "ssn",
      "dob",
    ],
    Address: ["street", "city", "state", "zip"],
    Loan: [
      "loanStatus",
      "loanType",
      "loanAmount",
      "interestRate",
      "loanTerm",
      "creditScore",
      "annualIncome",
      "employer",
    ],
    Generic: [
      "timestamp",
      "epochMs",
      "index",
      "randomInt",
      "randomFloat",
      "boolean",
    ],
  };

  function renderVariables() {
    const container = $("#variablesList");
    for (const [category, vars] of Object.entries(VAR_CATEGORIES)) {
      for (const v of vars) {
        const chip = document.createElement("div");
        chip.className = "var-chip";
        chip.title = `Click to copy {{${v}}}`;
        chip.innerHTML = `{{${v}}}<span class="var-category">${category}</span>`;
        chip.addEventListener("click", () => {
          // Insert at cursor in the value textarea, or copy to clipboard
          const textarea = $("#msgValue");
          const tag = `{{${v}}}`;
          if (
            document.activeElement === textarea ||
            textarea === document.querySelector(":focus")
          ) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value =
              textarea.value.substring(0, start) +
              tag +
              textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd =
              start + tag.length;
            textarea.focus();
          } else {
            navigator.clipboard.writeText(tag).then(() => {
              chip.style.background = "var(--success)";
              setTimeout(() => {
                chip.style.background = "";
              }, 300);
            });
          }
          saveState();
        });
        container.appendChild(chip);
      }
    }
  }

  // --- Collapsible panels ---
  document.querySelectorAll(".collapsible-header").forEach((header) => {
    header.addEventListener("click", () => {
      header.closest(".collapsible").classList.toggle("collapsed");
    });
  });

  // --- Insert loan application template ---
  $("#btnInsertTemplate").addEventListener("click", () => {
    const template = JSON.stringify(
      {
        loanId: "{{loanId}}",
        applicationId: "{{applicationId}}",
        applicant: {
          firstName: "{{firstName}}",
          lastName: "{{lastName}}",
          ssn: "{{ssn}}",
          dob: "{{dob}}",
          email: "{{email}}",
          phone: "{{phone}}",
        },
        address: {
          street: "{{street}}",
          city: "{{city}}",
          state: "{{state}}",
          zip: "{{zip}}",
        },
        loan: {
          type: "{{loanType}}",
          amount: "{{loanAmount}}",
          term: "{{loanTerm}}",
          interestRate: "{{interestRate}}",
          status: "{{loanStatus}}",
        },
        creditScore: "{{creditScore}}",
        annualIncome: "{{annualIncome}}",
        employer: "{{employer}}",
        timestamp: "{{timestamp}}",
      },
      null,
      2,
    );
    $("#msgValue").value = template;
    saveState();
    log("Inserted loan application template", "info");
  });

  // --- Poll status ---
  setInterval(async () => {
    if (!isConnected) return;
    try {
      const status = await api("GET", "/status");
      if (!status.connected) updateConnectionUI("disconnected");
    } catch {}
  }, 5000);

  // --- Init ---
  loadState();
  renderVariables();

  // Load env-driven defaults — env vars take priority over localStorage
  api("GET", "/defaults")
    .then((defaults) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      const hasSaved = !!saved;
      if (defaults.brokers) $("#brokers").value = defaults.brokers;
      else if (!hasSaved) $("#brokers").value = "localhost:9092";
      if (defaults.clientId) $("#clientId").value = defaults.clientId;
      if (defaults.topic) $("#topic").value = defaults.topic;
      if (defaults.key) $("#msgKey").value = defaults.key;
      if (defaults.value) $("#msgValue").value = defaults.value;
    })
    .catch(() => {});
})();
