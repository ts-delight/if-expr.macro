interface IfChain<TSuccess = undefined, TFailure = undefined> {
  then<T>(expr: T): IfChain<T, TFailure>;
  else<T>(expr: T): IfChain<TSuccess, T>;
  thenDo<T>(...exprs: any[]): IfChain<TSuccess, TFailure>;
  elseDo<T>(...exprs: any[]): IfChain<TSuccess, TFailure>;
  end: TSuccess | TFailure;
}

declare function If(target: any): IfChain;

export = If;
