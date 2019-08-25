interface IfChain<TSuccess = undefined, TFailure = undefined> {
  (): TSuccess | TFailure;
  then<T>(expr: T): IfChain<T, TFailure>;
  else<T>(expr: T): IfChain<TSuccess, T>;
  thenDo<T>(...exprs: any[]): IfChain<TSuccess, TFailure>;
  elseDo<T>(...exprs: any[]): IfChain<TSuccess, TFailure>;
  elseIf<T>(expr: T): IfChain<undefined, undefined>;
}

declare function If(target: any): IfChain;

export = If;
