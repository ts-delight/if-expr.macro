const { createMacro, MacroError } = require('babel-plugin-macros');
const { codeFrameColumns } = require('@babel/code-frame');

const pkgName = 'fluent-react.macro';
const debug = require('debug')(pkgName);

const IfExpr = ({ references, state, babel }) => {
  debug('Initial state:', state);

  // Utilities to help with ast construction
  const t = babel.types;
  const refKeys = Object.keys(references);
  const invalidRefKeys = refKeys.filter(key => key !== 'default');

  if (invalidRefKeys.length > 0) {
    throw new MacroError(
      `Invalid import from if-expr.macro: ${invalidRefKeys.join(', ')}`
    );
  }

  const processed = new Set();
  const isPending = path => !processed.has(path.node);
  const refs = references.default;

  const processReference = (nodePath, references) => {
    if (!isPending(nodePath)) return;
    let parentPath = findParent(nodePath);
    if (!t.isCallExpression(parentPath.node)) {
      failWith(1, parentPath.node, 'Expected If to be invoked as a function');
    }
    const args = parentPath.node.arguments;
    ensureArgsProcessed(args, references);
    if (args.length !== 1) {
      failWith(
        2,
        parentPath.node,
        'Expected If to have been invoked with a single argument'
      );
    }
    const target = parentPath.node.arguments[0];
    const { topMostPath, resultExpr } = processChain(
      parentPath,
      target,
      references
    );
    topMostPath.replaceWith(resultExpr);
    processed.add(nodePath.node);
  };

  // Find immediate parent
  const findParent = nodePath => nodePath.findParent(() => true);

  // Print well formatted errors
  const failWith = (errCode, node, message) => {
    if (node.loc) console.log(codeFrameColumns(code, node.loc, { message }));
    const error = new Error(`ERR${errCode}: ${message}`);
    error.code = `ERR${errCode}`;
    throw error;
  };

  const processChain = (parentPath, target, references) => {
    const branches = {
      consequent: [],
      alternate: [],
    };

    while (true) {
      const nextParentPath = findParent(parentPath);
      if (
        t.isMemberExpression(nextParentPath.node) &&
        nextParentPath.node.object === parentPath.node
      ) {
        parentPath = nextParentPath;
        const memberNode = parentPath.node;
        const propName = memberNode.property.name;
        let branch;
        if (propName === 'then' || propName === 'thenDo') {
          branch = 'consequent';
        } else if (propName === 'else' || propName === 'elseDo') {
          branch = 'alternate';
        }
        if (branch) {
          parentPath = findParent(parentPath);
          assertCallExpr(parentPath, propName);
          ensureArgsProcessed(
            parentPath.node.arguments,
            references,
            processed,
            t
          );
          if (propName === 'then' || propName === 'else') {
            const arg = ensureSingleArg(parentPath, propName);
            assertExprLike(arg, parentPath, propName);
            branches[branch].push(arg);
          } else {
            const len = branches[branch].length;
            let last =
              len > 0 ? branches[branch].pop() : t.identifier('undefined');
            for (const arg of parentPath.node.arguments) {
              branches[branch].push(arg);
            }
            branches[branch].push(last);
          }
        } else if (propName === 'elseIf') {
          parentPath = findParent(parentPath);
          assertCallExpr(parentPath, propName);
          ensureArgsProcessed(
            parentPath.node.arguments,
            references,
            processed,
            t
          );
          const arg = ensureSingleArg(parentPath, propName);
          assertExprLike(arg, parentPath, propName);
          const { topMostPath, resultExpr } = processChain(
            parentPath,
            arg,
            references,
            processed,
            t
          );
          branches.alternate.push(resultExpr);
          return {
            topMostPath,
            resultExpr: makeConditional(branches, target),
          };
        } else {
          failWith(6, memberNode, 'Invocation of unknown member on If-chain');
        }
      } else if (
        t.isCallExpression(nextParentPath.node) &&
        nextParentPath.node.callee === parentPath.node
      ) {
        return {
          topMostPath: nextParentPath,
          resultExpr: makeConditional(branches, target),
        };
      } else {
        failWith(5, parentPath.node, `Unterminated If-chain`);
      }
    }
  };

  const assertCallExpr = (parentPath, propName) => {
    if (!t.isCallExpression(parentPath.node)) {
      failWith(
        4,
        parentPath.node,
        `Expected member ${propName} to have been invoked as a function`
      );
    }
  };

  const makeConditional = (branches, target) => {
    for (const branchKey of Object.keys(branches)) {
      const val = branches[branchKey];
      if (val.length === 0) branches[branchKey] = t.identifier('undefined');
      else if (val.length === 1) branches[branchKey] = val[0];
      else branches[branchKey] = t.sequenceExpression(val);
    }
    return t.conditionalExpression(
      target,
      branches.consequent,
      branches.alternate
    );
  };

  const ensureSingleArg = (parentPath, propName) => {
    if (parentPath.node.arguments.length !== 1) {
      failWith(
        8,
        parentPath.node,
        `Expected member ${propName} to have been invoked with one argument`
      );
    }
    return parentPath.node.arguments[0];
  };

  const assertExprLike = (arg, parentPath, propName) => {
    if (
      arg.type !== 'Identifier' &&
      !arg.type.match(/Expression$/) &&
      !arg.type.match(/Literal$/)
    ) {
      failWith(
        7,
        parentPath.node,
        `Expected argument passed to ${propName} to have been an identifier, literal or expression`
      );
    }
  };

  const ensureArgsProcessed = (args, references) => {
    for (const arg of args) {
      for (let i = 0; i < references.length; i++) {
        const nodePath = references[i];
        const parent = nodePath.findParent(p => p.node === arg);
        if (!parent) continue;
        processReference(nodePath, references.slice(i + 1));
      }
    }
  };

  for (let i = 0; i < refs.length; i++) {
    const nodePath = refs[i];
    processReference(nodePath, refs.slice(i + 1));
  }
};

module.exports = createMacro(IfExpr);
