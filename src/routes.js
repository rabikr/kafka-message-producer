const express = require("express");
const producer = require("./kafkaProducer");
const { listVariables } = require("./templateEngine");

const router = express.Router();

// --- Connect / Disconnect ---

router.post("/connect", async (req, res) => {
  try {
    const { brokers, clientId } = req.body;
    if (!brokers) return res.status(400).json({ error: "brokers is required" });
    await producer.connect(brokers, clientId);
    res.json({ success: true, message: "Connected to Kafka" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/disconnect", async (req, res) => {
  try {
    await producer.disconnect();
    res.json({ success: true, message: "Disconnected from Kafka" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Produce endpoints ---

router.post("/produce/single", async (req, res) => {
  try {
    const { topic, key, value, headers } = req.body;
    if (!topic || value === undefined) {
      return res.status(400).json({ error: "topic and value are required" });
    }
    const result = await producer.sendSingle(topic, key, value, headers);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/produce/count", async (req, res) => {
  try {
    const { topic, key, value, headers, count } = req.body;
    if (!topic || value === undefined || !count) {
      return res
        .status(400)
        .json({ error: "topic, value, and count are required" });
    }
    const num = parseInt(count, 10);
    if (isNaN(num) || num < 1 || num > 10000) {
      return res
        .status(400)
        .json({ error: "count must be between 1 and 10000" });
    }
    const result = await producer.sendCount(topic, key, value, headers, num);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/produce/interval", async (req, res) => {
  try {
    const { topic, key, value, headers, intervalMs } = req.body;
    if (!topic || value === undefined || !intervalMs) {
      return res
        .status(400)
        .json({ error: "topic, value, and intervalMs are required" });
    }
    const ms = parseInt(intervalMs, 10);
    if (isNaN(ms) || ms < 100) {
      return res.status(400).json({ error: "intervalMs must be at least 100" });
    }
    const id = producer.startInterval(topic, key, value, headers, ms);
    res.json({
      success: true,
      intervalId: id,
      message: `Sending every ${ms}ms`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/produce/interval/stop", async (req, res) => {
  try {
    const { intervalId } = req.body;
    if (intervalId) {
      const result = producer.stopInterval(intervalId);
      if (!result) return res.status(404).json({ error: "Interval not found" });
      res.json({ success: true, ...result });
    } else {
      const results = producer.stopAllIntervals();
      res.json({ success: true, stopped: results });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Status ---

router.get("/status", (req, res) => {
  res.json(producer.getStatus());
});

// --- Template variables ---

router.get("/variables", (req, res) => {
  res.json(listVariables());
});

// --- Defaults (env-driven) ---

router.get("/defaults", (req, res) => {
  res.json({
    brokers: process.env.KAFKA_BROKER_DEFAULT || "",
    clientId: process.env.KAFKA_CLIENT_ID || "",
    topic: process.env.KAFKA_TOPIC || "",
    key: process.env.KAFKA_KEY || "",
    value: process.env.KAFKA_VALUE || "",
  });
});

module.exports = router;
