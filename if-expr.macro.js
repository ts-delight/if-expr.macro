const { createMacro, MacroError } = require('babel-plugin-macros');

function IfExpr({ references, state, babel }) {
  const t = babel.types;
  const refKeys = Object.keys(references);
  const invalidRefKeys = refKeys.filter(key => key !== 'default');

  if (invalidRefKeys.length > 0) {
    throw new MacroError(
      `Invalid import from if-expr.macro: ${invalidRefKeys.join(', ')}`
    );
  }

  for (const nodePath of references.default) {
    let parentPath = parentPathOf(nodePath);
    if (parentPath.node.type !== 'CallExpression') {
      throw new MacroError(
        `Expected If to be invoked as a function at ${stringifyLocStart(
          parentPath.node.loc
        )}`
      );
    }
    if (parentPath.node.arguments.length !== 1) {
      throw new MacroError(
        `Expected If to have been invoked with a single argument at ${stringifyLocStart(
          parentPath.node.loc
        )}`
      );
    }
    const target = parentPath.node.arguments[0];
    const { topMostPath, resultExpr } = processChain(parentPath, target, t);
    topMostPath.replaceWith(resultExpr);
  }
}

module.exports = createMacro(IfExpr);

const parentPathOf = nodePath => nodePath.findParent(() => true);

const stringifyLocStart = loc => {
  if (!loc || !loc.start) return '';
  if (!loc.start.column) return `L${loc.start.line}`;
  return `L${loc.start.line}C${loc.start.column}`;
};

const processChain = (parentPath, target, t) => {
  const branches = {
    consequent: [],
    alternate: [],
  };

  while (true) {
    const nextParentPath = parentPathOf(parentPath);
    if (nextParentPath.node.type === 'MemberExpression') {
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
        parentPath = parentPathOf(parentPath);
        assertCallExpr(parentPath, propName);
        if (propName === 'then' || propName === 'else') {
          const arg = assertSingle(parentPath, propName);
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
      } else if (propName === 'end' || propName === 'end$') {
        return {
          topMostPath: parentPath,
          resultExpr: makeConditional(branches, target, t),
        };
      } else if (propName === 'elseIf') {
        parentPath = parentPathOf(parentPath);
        assertCallExpr(parentPath, propName);
        const arg = assertSingle(parentPath, propName);
        assertExprLike(arg, parentPath, propName);
        const { topMostPath, resultExpr } = processChain(parentPath, arg, t);
        branches.alternate.push(resultExpr);
        return {
          topMostPath,
          resultExpr: makeConditional(branches, target, t),
        };
      } else {
        throw new MacroError(
          `Unexpected member invocation on If chain: ${propName} at ${stringifyLocStart(
            memberNode.loc
          )}`
        );
      }
    } else {
      throw new Error(
        `Expected the If-chain (started at ${stringifyLocStart(
          parentPath.node.loc
        )}) to have been terminated with an end`
      );
    }
  }
};

const assertCallExpr = (parentPath, propName) => {
  if (parentPath.node.type !== 'CallExpression') {
    throw new MacroError(
      `Expected member ${propName} to have been invoked as a function at ${stringifyLocStart(
        parentPath.node.loc
      )}`
    );
  }
};

const makeConditional = (branches, target, t) => {
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

const assertSingle = (parentPath, propName) => {
  if (parentPath.node.arguments.length !== 1) {
    throw new MacroError(
      `Expected member ${propName} to have been invoked with one argument at ${stringifyLocStart(
        parentPath.node.loc
      )}`
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
    throw new MacroError(
      `Expected argument passed to ${propName} to have been an identifier, literal or expression at ${stringifyLocStart(
        parentPath.node.loc
      )}`
    );
  }
};
