import * as pathUtils from "path";
import { Loader } from "./Loader";

export class ModuleLoader implements Loader {
  constructor(private rootPath: string) {}

  async load(path: string): Promise<unknown> {
    const loadedModule = await import(pathUtils.resolve(this.rootPath, path));
    return loadedModule.default;
  }
}
