const FIRST_NAMES = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "David",
  "Elizabeth",
  "William",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Christopher",
  "Karen",
  "Charles",
  "Lisa",
  "Daniel",
  "Nancy",
  "Matthew",
  "Betty",
  "Anthony",
  "Margaret",
  "Mark",
  "Sandra",
  "Donald",
  "Ashley",
  "Steven",
  "Kimberly",
  "Paul",
  "Emily",
  "Andrew",
  "Donna",
  "Joshua",
  "Michelle",
  "Kenneth",
  "Carol",
  "Kevin",
  "Amanda",
  "Brian",
  "Dorothy",
  "George",
  "Melissa",
  "Timothy",
  "Deborah",
];
const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
];
const STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "PENDING_DOCUMENTS",
  "APPROVED",
  "CONDITIONALLY_APPROVED",
  "DENIED",
  "CANCELLED",
  "IN_PROCESSING",
  "FUNDED",
  "CLOSED",
];
const LOAN_TYPES = [
  "CONVENTIONAL",
  "FHA",
  "VA",
  "USDA",
  "JUMBO",
  "HOME_EQUITY",
  "PERSONAL",
  "AUTO",
  "STUDENT",
  "BUSINESS",
];
const STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];
const CITIES = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "Austin",
  "Jacksonville",
  "San Jose",
  "Columbus",
  "Charlotte",
  "Indianapolis",
  "San Francisco",
  "Seattle",
  "Denver",
  "Nashville",
  "Portland",
];
const EMPLOYERS = [
  "Acme Corp",
  "GlobalTech",
  "Sunrise Industries",
  "Pacific Holdings",
  "Mountain View Inc",
  "River Systems",
  "Atlas Solutions",
  "Vertex Group",
  "Pinnacle LLC",
  "Summit Partners",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function padZero(n, len) {
  return String(n).padStart(len, "0");
}

const generators = {
  // IDs
  uuid: () => crypto.randomUUID(),
  loanId: () => `${Date.now()}-${randInt(1000, 9999)}`,
  applicationId: () => `${padZero(randInt(100000000, 999999999), 9)}`,

  // Person
  firstName: () => pick(FIRST_NAMES),
  lastName: () => pick(LAST_NAMES),
  fullName: () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
  email: () => {
    const fn = pick(FIRST_NAMES).toLowerCase();
    const ln = pick(LAST_NAMES).toLowerCase();
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "email.com"];
    return `${fn}.${ln}${randInt(1, 99)}@${pick(domains)}`;
  },
  phone: () =>
    `${randInt(200, 999)}-${padZero(randInt(0, 999), 3)}-${padZero(randInt(0, 9999), 4)}`,
  ssn: () =>
    `${padZero(randInt(100, 999), 3)}-${padZero(randInt(10, 99), 2)}-${padZero(randInt(1000, 9999), 4)}`,
  dob: () => {
    const y = randInt(1955, 2000);
    const m = padZero(randInt(1, 12), 2);
    const d = padZero(randInt(1, 28), 2);
    return `${y}-${m}-${d}`;
  },

  // Address
  street: () =>
    `${randInt(100, 9999)} ${pick(["Main", "Oak", "Maple", "Cedar", "Pine", "Elm", "Park", "Lake", "Hill", "River"])} ${pick(["St", "Ave", "Blvd", "Dr", "Ln", "Way"])}`,
  city: () => pick(CITIES),
  state: () => pick(STATES),
  zip: () => padZero(randInt(10000, 99999), 5),

  // Loan
  loanStatus: () => pick(STATUSES),
  loanType: () => pick(LOAN_TYPES),
  loanAmount: () => randInt(10000, 1000000),
  interestRate: () => parseFloat((Math.random() * 6 + 2.5).toFixed(3)),
  loanTerm: () => pick([12, 24, 36, 48, 60, 120, 180, 240, 360]),
  creditScore: () => randInt(300, 850),
  annualIncome: () => randInt(25000, 500000),
  employer: () => pick(EMPLOYERS),

  // Generic
  timestamp: () => new Date().toISOString().split("T")[0],
  epochMs: () => Date.now(),
  index: null, // handled specially with context
  randomInt: () => randInt(1, 1000000),
  randomFloat: () => parseFloat((Math.random() * 1000).toFixed(2)),
  boolean: () => Math.random() > 0.5,
};

/**
 * Add an offset to a YYYY-MM-DD date string.
 * unit: 'd' (days), 'm' (months), 'y' (years)
 */
function addDateOffset(baseDateStr, sign, amount, unit) {
  const d = new Date(baseDateStr + "T00:00:00");
  const offset = (sign === "-" ? -1 : 1) * amount;
  switch (unit) {
    case "d":
      d.setDate(d.getDate() + offset);
      break;
    case "m":
      d.setMonth(d.getMonth() + offset);
      break;
    case "y":
      d.setFullYear(d.getFullYear() + offset);
      break;
  }
  return d.toISOString().split("T")[0];
}

/**
 * Resolve all {{varName}} placeholders in a string.
 * `context.index` is passed for {{index}} support.
 * Supports date offsets: {{timestamp+1m}}, {{timestamp-30d}}, {{timestamp+3y}}
 */
function resolveTemplate(template, context = {}) {
  if (typeof template !== "string") return template;

  if (!context._cache) context._cache = {};

  return template.replace(
    /\{\{(\w+)(?:\s*([+-])\s*(\d+)([dmy]))?\}\}/g,
    (match, varName, sign, amount, unit) => {
      if (varName === "index") return context.index ?? 0;

      // Cached variables: timestamp, applicationId
      if (varName === "timestamp") {
        if (context._cache.timestamp == null) {
          context._cache.timestamp = generators.timestamp();
        }
        const base = context._cache.timestamp;
        if (sign && amount && unit) {
          return addDateOffset(base, sign, parseInt(amount), unit);
        }
        return base;
      }

      if (varName === "applicationId") {
        if (context._cache.applicationId == null) {
          context._cache.applicationId = generators.applicationId();
        }
        const val = context._cache.applicationId;
        return typeof val === "string" ? val : JSON.stringify(val);
      }

      const gen = generators[varName];
      if (typeof gen === "function") {
        const val = gen();
        return typeof val === "string" ? val : JSON.stringify(val);
      }
      return match; // leave unknown placeholders as-is
    },
  );
}

/**
 * Deep-resolve an object/string/value.
 * Walks through JSON objects/arrays and resolves all string values.
 */
function resolveValue(value, context = {}) {
  if (typeof value === "string") {
    const resolved = resolveTemplate(value, context);
    // If the entire string was a single placeholder that resolved to a non-string, parse it
    if (resolved !== value) {
      try {
        const parsed = JSON.parse(resolved);
        if (typeof parsed === "number" || typeof parsed === "boolean")
          return parsed;
      } catch {}
    }
    return resolved;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, context));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = resolveValue(v, context);
    }
    return out;
  }
  return value;
}

/** Returns the list of available variable names for the UI reference */
function listVariables() {
  return Object.keys(generators);
}

module.exports = { resolveValue, listVariables };
