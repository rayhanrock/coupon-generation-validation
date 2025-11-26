const fs = require("fs");
const path = require("path");
const morgan = require("morgan");

// Place logs folder in project root
const logDirectory = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Create write stream for access.log
const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, "access.log"),
  { flags: "a" }
);

// Custom BD time token (YYYY-MM-DD HH:mm:ss in Asia/Dhaka)
morgan.token("date-time", () => {
  return new Date()
    .toLocaleString("en-GB", {
      timeZone: "Asia/Dhaka",
      hour12: true,
    })
    .replace(",", "");
});

// Custom log format
const customFormat =
  ":date-time :remote-addr :method :url :status :response-time ms :user-agent";

// Console logger (dev format)
const consoleLogger = morgan("dev");

// File logger (custom format)
const fileLogger = morgan(customFormat, { stream: accessLogStream });

// Export both
module.exports = [consoleLogger, fileLogger];
