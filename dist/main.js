"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const MemorySetupLoader_1 = require("./loader/MemorySetupLoader");
const Scraper_1 = require("./Scraper");
const testSetup_1 = __importDefault(require("./testSetup"));
const logger = winston_1.default.createLogger({
    transports: [
        new winston_1.default.transports.Console(),
    ]
});
const loader = new MemorySetupLoader_1.MemorySetupLoader({ "default": testSetup_1.default });
const scraper = new Scraper_1.Scraper(logger, loader);
(async function () {
    await scraper.scrape("default");
}());
