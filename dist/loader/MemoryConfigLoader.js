"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryConfigLoader = void 0;
class MemoryConfigLoader {
    constructor(scrapeConfigs) {
        this.scrapeConfigs = scrapeConfigs;
    }
    async import(path) {
        return this.scrapeConfigs[path];
    }
}
exports.MemoryConfigLoader = MemoryConfigLoader;
