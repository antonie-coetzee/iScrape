import { program } from "commander";
import path from "path";
import winston from "winston";
import { MemoryLoader, ModuleLoader } from "./loader";
import { Scraper } from "./Scraper";
import testSetup from "./testSetup";

program
  .name("iscrape")
  .description("basic web scraping utility")
  .version("0.1.0");

program.requiredOption("-s, --setup <path>", "setup script path");

program.parse();

const options = program.opts();

const debugMode = !__filename.includes("snapshot");
const rootDir = debugMode ? __dirname : path.dirname(process.execPath);

const baseLoggerFormat = winston.format.combine(
  winston.format.timestamp({format: 'YYYY-MM-DDTHH:mm:ss'}),
  winston.format.align(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level} ${info.message.trim()}`
  )
);

const consoleLoggerFormat = winston.format.combine(
  winston.format.colorize(),
  baseLoggerFormat
);

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: consoleLoggerFormat,
    }),
    new winston.transports.File({
      maxFiles: 20,
      maxsize: 10000000,
      filename: rootDir + "/logs/log.txt",
      format: baseLoggerFormat,
    }),
  ],
});

const loader = debugMode
  ? new MemoryLoader({ default: testSetup })
  : new ModuleLoader(rootDir);

const scraper = new Scraper(logger, loader, rootDir, debugMode);

(async function () {
  try{
    await scraper.scrape(debugMode ? "default" : options.setup);
  }catch(e){
    logger.error(String(e));  
    logger.end();
    process.exit(0)
  }
})();
