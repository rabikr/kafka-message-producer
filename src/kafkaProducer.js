const { Kafka, logLevel } = require("kafkajs");
const { resolveValue } = require("./templateEngine");

class KafkaProducerService {
  constructor() {
    this.producer = null;
    this.kafka = null;
    this.connected = false;
    this.activeIntervals = new Map();
    this.intervalCounter = 0;
  }

  async connect(brokers, clientId = "kafka-message-producer") {
    if (this.connected) {
      await this.disconnect();
    }

    this.kafka = new Kafka({
      clientId,
      brokers: brokers.split(",").map((b) => b.trim()),
      logLevel: logLevel.WARN,
      retry: { retries: 3 },
    });

    this.producer = this.kafka.producer();
    await this.producer.connect();
    this.connected = true;
  }

  async disconnect() {
    this.stopAllIntervals();
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
      this.kafka = null;
      this.connected = false;
    }
  }

  _buildMessages(key, value, headers, context = {}) {
    const resolvedValue = resolveValue(value, context);
    const message = {
      value:
        typeof resolvedValue === "string"
          ? resolvedValue
          : JSON.stringify(resolvedValue),
    };
    if (key) {
      message.key = typeof key === "string" ? resolveValue(key, context) : key;
    }
    if (headers && Object.keys(headers).length > 0) {
      message.headers = resolveValue(headers, context);
    }
    return message;
  }

  async sendSingle(topic, key, value, headers) {
    if (!this.connected) throw new Error("Producer not connected");
    const message = this._buildMessages(key, value, headers, { index: 0 });
    const result = await this.producer.send({ topic, messages: [message] });
    return { sent: 1, result };
  }

  async sendCount(topic, key, value, headers, count) {
    if (!this.connected) throw new Error("Producer not connected");
    const messages = [];
    for (let i = 0; i < count; i++) {
      messages.push(this._buildMessages(key, value, headers, { index: i }));
    }
    const result = await this.producer.send({ topic, messages });
    return { sent: count, result };
  }

  startInterval(topic, key, value, headers, intervalMs, onSend) {
    if (!this.connected) throw new Error("Producer not connected");

    const id = `interval-${++this.intervalCounter}`;
    let sentCount = 0;

    const timer = setInterval(async () => {
      try {
        const message = this._buildMessages(key, value, headers, {
          index: sentCount,
        });
        await this.producer.send({ topic, messages: [message] });
        sentCount++;
        if (onSend) onSend(id, sentCount);
      } catch (err) {
        console.error(`Interval ${id} send error:`, err.message);
      }
    }, intervalMs);

    this.activeIntervals.set(id, {
      timer,
      sentCount: () => sentCount,
      topic,
      intervalMs,
    });
    return id;
  }

  stopInterval(id) {
    const entry = this.activeIntervals.get(id);
    if (!entry) return null;
    clearInterval(entry.timer);
    const sentCount = entry.sentCount();
    this.activeIntervals.delete(id);
    return { id, sentCount };
  }

  stopAllIntervals() {
    const results = [];
    for (const [id] of this.activeIntervals) {
      results.push(this.stopInterval(id));
    }
    return results;
  }

  getStatus() {
    const intervals = [];
    for (const [id, entry] of this.activeIntervals) {
      intervals.push({
        id,
        topic: entry.topic,
        intervalMs: entry.intervalMs,
        sent: entry.sentCount(),
      });
    }
    return {
      connected: this.connected,
      activeIntervals: intervals,
    };
  }
}

module.exports = new KafkaProducerService();
