"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySetupLoader = void 0;
class MemorySetupLoader {
    constructor(scrapeSetups) {
        this.scrapeSetups = scrapeSetups;
    }
    async import(path) {
        return this.scrapeSetups[path];
    }
}
exports.MemorySetupLoader = MemorySetupLoader;
