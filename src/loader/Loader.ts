export interface Loader {
  import: (path:string)=>Promise<unknown>;
}