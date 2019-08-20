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
    const test = parentPath.node.arguments[0];
    const branches = {
      consequent: [],
      alternate: [],
    };
    let didEnd = false;
    while (true) {
      const nextParentPath = parentPathOf(parentPath);
      if (nextParentPath.node.type === 'MemberExpression') {
        parentPath = nextParentPath;
        const memberNode = parentPath.node;
        const propName = memberNode.property.name;
        let branch;
        if (propName === 'then' || propName === 'thenDo') branch = 'consequent';
        else if (propName === 'else' || propName === 'elseDo')
          branch = 'alternate';
        if (branch) {
          parentPath = parentPathOf(parentPath);
          if (parentPath.node.type !== 'CallExpression') {
            throw new MacroError(
              `Expected member ${propName} to have been invoked as a function at ${stringifyLocStart(
                parentPath.node.loc
              )}`
            );
          }
          if (propName === 'then' || propName === 'else') {
            if (parentPath.node.arguments.length !== 1) {
              throw new MacroError(
                `Expected member ${propName} to have been invoked with one argument at ${stringifyLocStart(
                  parentPath.node.loc
                )}`
              );
            }
            const arg = parentPath.node.arguments[0];
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
          didEnd = true;
          break;
        } else {
          throw new MacroError(
            `Unexpected member invocation on If chain: ${
              memberNode.property.name
            } at ${stringifyLocStart(memberNode.loc)}`
          );
        }
      } else break;
    }
    if (!didEnd)
      throw new MacroError(
        `Expected If chain to have been concluded with .end invocation at ${stringifyLocStart(
          parentPath.node.loc
        )}`
      );
    for (const branchKey of Object.keys(branches)) {
      const val = branches[branchKey];
      if (val.length === 0) branches[branchKey] = t.identifier('undefined');
      else if (val.length === 1) branches[branchKey] = val[0];
      else branches[branchKey] = t.sequenceExpression(val);
    }
    parentPath.replaceWith(
      t.conditionalExpression(test, branches.consequent, branches.alternate)
    );
  }
}

module.exports = createMacro(IfExpr);

const parentPathOf = nodePath => nodePath.findParent(() => true);

const stringifyLocStart = loc => {
  if (!loc || !loc.start) return '';
  if (!loc.start.column) return `L${loc.start.line}`;
  return `L${loc.start.line}C${loc.start.column}`;
};
