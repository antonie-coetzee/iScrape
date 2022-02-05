export interface Loader {
  load: (path:string)=>Promise<unknown>;
}