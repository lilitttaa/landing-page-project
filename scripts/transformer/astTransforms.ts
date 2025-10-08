import * as ts from 'typescript';

export function applyAstTransforms(
  content: string,
  fileName: string,
  editableImports: string[]
): string {
  const sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let statements = Array.from(sourceFile.statements);

  const importResult = ensureEditableImport(statements, editableImports);
  statements = importResult.statements;

  let componentChanged = false;
  const transformedStatements = statements.map((statement) => {
    const transformed = updateComponentStatement(statement);
    if (transformed !== statement) {
      componentChanged = true;
    }
    return transformed;
  });

  if (!importResult.changed && !componentChanged) {
    return content;
  }

  const updatedSource = ts.factory.updateSourceFile(
    sourceFile,
    ts.factory.createNodeArray(transformedStatements)
  );
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printFile(updatedSource);
}

export function ensureEditableImport(
  statements: ts.Statement[],
  editableImports: string[]
): { statements: ts.Statement[]; changed: boolean } {
  const names = Array.from(new Set(editableImports));
  let changed = false;
  let lastImportIndex = -1;
  let editableImportIndex = -1;
  let editableImport: ts.ImportDeclaration | undefined;

  statements.forEach((statement, index) => {
    if (ts.isImportDeclaration(statement)) {
      lastImportIndex = index;
      const moduleSpecifier = statement.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === '../editable') {
        editableImportIndex = index;
        editableImport = statement;
      }
    }
  });

  if (editableImport) {
    const importClause = editableImport.importClause;
    const existingNames =
      importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)
        ? importClause.namedBindings.elements.map((element) => element.name.text)
        : [];
    const missing = names.filter((name) => !existingNames.includes(name));

    if (missing.length > 0) {
      const combined = [...existingNames, ...missing].map((name) =>
        ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
      );

      const namedImports = ts.factory.createNamedImports(combined);
      const updatedClause = ts.factory.createImportClause(
        importClause?.isTypeOnly ?? false,
        importClause?.name,
        namedImports
      );

      const updatedImport = ts.factory.updateImportDeclaration(
        editableImport,
        editableImport.modifiers,
        updatedClause,
        editableImport.moduleSpecifier,
        editableImport.assertClause
      );

      const newStatements = [...statements];
      newStatements[editableImportIndex] = updatedImport;
      changed = true;
      return { statements: newStatements, changed };
    }

    return { statements, changed };
  }

  const importSpecifiers = names.map((name) =>
    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
  );

  const newImport = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports(importSpecifiers)),
    ts.factory.createStringLiteral('../editable')
  );

  const insertIndex = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
  const newStatements = [...statements];
  newStatements.splice(insertIndex, 0, newImport);
  changed = true;
  return { statements: newStatements, changed };
}

export function updateComponentStatement(statement: ts.Statement): ts.Statement {
  if (!ts.isVariableStatement(statement)) {
    return statement;
  }

  const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
  if (!isExported) {
    return statement;
  }

  const declarations = statement.declarationList.declarations;
  if (declarations.length !== 1) {
    return statement;
  }

  const declaration = declarations[0];
  if (!declaration.initializer || !ts.isArrowFunction(declaration.initializer)) {
    return statement;
  }

  const updatedArrow = updateComponentArrowFunction(declaration.initializer);
  if (updatedArrow === declaration.initializer) {
    return statement;
  }

  const updatedDeclaration = ts.factory.updateVariableDeclaration(
    declaration,
    declaration.name,
    declaration.exclamationToken,
    declaration.type,
    updatedArrow
  );

  const updatedDeclarationList = ts.factory.updateVariableDeclarationList(statement.declarationList, [
    updatedDeclaration
  ]);

  return ts.factory.updateVariableStatement(statement, statement.modifiers, updatedDeclarationList);
}

export function updateComponentArrowFunction(arrowFunction: ts.ArrowFunction): ts.ArrowFunction {
  let hasChanges = false;
  const params = Array.from(arrowFunction.parameters);

  if (params.length > 0) {
    const extendedParam = extendPropsParameter(params[0]);
    if (extendedParam !== params[0]) {
      params[0] = extendedParam;
      hasChanges = true;
    }
  }

  let body = arrowFunction.body;
  if (ts.isBlock(body)) {
    const updatedBody = ensureEditProviderSetup(body);
    if (updatedBody !== body) {
      body = updatedBody;
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    return arrowFunction;
  }

  return ts.factory.updateArrowFunction(
    arrowFunction,
    arrowFunction.modifiers,
    arrowFunction.typeParameters,
    ts.factory.createNodeArray(params),
    arrowFunction.type,
    arrowFunction.equalsGreaterThanToken,
    body
  );
}

export function extendPropsParameter(parameter: ts.ParameterDeclaration): ts.ParameterDeclaration {
  if (!parameter.type) {
    return parameter;
  }

  if (paramHasEditProps(parameter.type)) {
    return parameter;
  }

  const intersectionType = ts.factory.createIntersectionTypeNode([parameter.type, createEditPropsType()]);
  return ts.factory.updateParameterDeclaration(
    parameter,
    parameter.modifiers,
    parameter.dotDotDotToken,
    parameter.name,
    parameter.questionToken,
    intersectionType,
    parameter.initializer
  );
}

export function paramHasEditProps(typeNode: ts.TypeNode): boolean {
  if (ts.isIntersectionTypeNode(typeNode)) {
    return typeNode.types.some((type) => typeNodeHasEditProps(type));
  }
  return typeNodeHasEditProps(typeNode);
}

function typeNodeHasEditProps(typeNode: ts.TypeNode): boolean {
  if (!ts.isTypeLiteralNode(typeNode)) {
    return false;
  }

  let hasIsEditMode = false;
  let hasOnUpdate = false;
  let hasBasePath = false;

  for (const member of typeNode.members) {
    if (ts.isPropertySignature(member) && member.name) {
      const name = getPropertyNameText(member.name);
      if (name === 'isEditMode') {
        hasIsEditMode = true;
      } else if (name === 'onUpdate') {
        hasOnUpdate = true;
      } else if (name === 'basePath') {
        hasBasePath = true;
      }
    }
  }

  return hasIsEditMode && hasOnUpdate && hasBasePath;
}

function getPropertyNameText(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name)) {
    return name.text;
  }
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

export function createEditPropsType(): ts.TypeNode {
  const isEditModeProp = ts.factory.createPropertySignature(
    undefined,
    'isEditMode',
    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
  );

  const onUpdateProp = ts.factory.createPropertySignature(
    undefined,
    'onUpdate',
    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
    ts.factory.createFunctionTypeNode(
      undefined,
      [
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          ts.factory.createIdentifier('path'),
          undefined,
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
        ),
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          ts.factory.createIdentifier('value'),
          undefined,
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        )
      ],
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
    )
  );

  const basePathProp = ts.factory.createPropertySignature(
    undefined,
    'basePath',
    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
  );

  return ts.factory.createTypeLiteralNode([isEditModeProp, onUpdateProp, basePathProp]);
}

export function ensureEditProviderSetup(body: ts.Block): ts.Block {
  let statements = Array.from(body.statements);
  let changed = false;

  const destructureIndex = statements.findIndex((statement) => isEditPropsDestructure(statement));
  const handleUpdateIndex = statements.findIndex((statement) => isHandleUpdateStatement(statement));

  if (destructureIndex === -1) {
    statements = [createEditPropsDestructure(), ...statements];
    changed = true;
  }

  const currentDestructureIndex = statements.findIndex((statement) => isEditPropsDestructure(statement));
  if (currentDestructureIndex !== -1 && handleUpdateIndex === -1) {
    statements.splice(currentDestructureIndex + 1, 0, createHandleUpdateStatement());
    changed = true;
  }

  const updatedStatements = statements.map((statement) => {
    if (ts.isReturnStatement(statement) && statement.expression) {
      const updatedReturn = wrapReturnWithEditProvider(statement);
      if (updatedReturn !== statement) {
        changed = true;
      }
      return updatedReturn;
    }
    return statement;
  });

  if (!changed) {
    return body;
  }

  return ts.factory.updateBlock(body, ts.factory.createNodeArray(updatedStatements));
}

export function isEditPropsDestructure(statement: ts.Statement): boolean {
  if (!ts.isVariableStatement(statement)) {
    return false;
  }
  if (!(statement.declarationList.flags & ts.NodeFlags.Const)) {
    return false;
  }

  const declarations = statement.declarationList.declarations;
  if (declarations.length !== 1) {
    return false;
  }

  const declaration = declarations[0];
  if (!ts.isObjectBindingPattern(declaration.name)) {
    return false;
  }

  if (
    !declaration.initializer ||
    !ts.isIdentifier(declaration.initializer) ||
    declaration.initializer.text !== 'props'
  ) {
    return false;
  }

  const names = new Set<string>();
  for (const element of declaration.name.elements) {
    if (ts.isIdentifier(element.name)) {
      names.add(element.name.text);
    }
  }

  return names.has('isEditMode') && names.has('onUpdate') && names.has('basePath');
}

export function isHandleUpdateStatement(statement: ts.Statement): boolean {
  if (!ts.isVariableStatement(statement)) {
    return false;
  }

  const declarations = statement.declarationList.declarations;
  if (declarations.length !== 1) {
    return false;
  }

  const declaration = declarations[0];
  return ts.isIdentifier(declaration.name) && declaration.name.text === 'handleUpdate';
}

export function createEditPropsDestructure(): ts.Statement {
  const bindingElements = [
    ts.factory.createBindingElement(
      undefined,
      undefined,
      ts.factory.createIdentifier('isEditMode'),
      ts.factory.createFalse()
    ),
    ts.factory.createBindingElement(
      undefined,
      undefined,
      ts.factory.createIdentifier('onUpdate'),
      ts.factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.factory.createBlock([], true)
      )
    ),
    ts.factory.createBindingElement(
      undefined,
      undefined,
      ts.factory.createIdentifier('basePath'),
      undefined
    )
  ];

  const bindingPattern = ts.factory.createObjectBindingPattern(bindingElements);
  const declaration = ts.factory.createVariableDeclaration(
    bindingPattern,
    undefined,
    undefined,
    ts.factory.createIdentifier('props')
  );

  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList([declaration], ts.NodeFlags.Const)
  );
}

export function createHandleUpdateStatement(): ts.Statement {
  const pathParam = ts.factory.createParameterDeclaration(
    undefined,
    undefined,
    ts.factory.createIdentifier('path'),
    undefined,
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
  );

  const valueParam = ts.factory.createParameterDeclaration(
    undefined,
    undefined,
    ts.factory.createIdentifier('value'),
    undefined,
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
  );

  const consoleLog = ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('console'),
        ts.factory.createIdentifier('log')
      ),
      undefined,
      [
        ts.factory.createStringLiteral('Update:'),
        ts.factory.createIdentifier('path'),
        ts.factory.createIdentifier('value')
      ]
    )
  );

  const onUpdateCall = ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(ts.factory.createIdentifier('onUpdate'), undefined, [
      ts.factory.createIdentifier('path'),
      ts.factory.createIdentifier('value')
    ])
  );

  const ifStatement = ts.factory.createIfStatement(
    ts.factory.createIdentifier('onUpdate'),
    ts.factory.createBlock([onUpdateCall], true)
  );

  const arrowFunction = ts.factory.createArrowFunction(
    undefined,
    undefined,
    [pathParam, valueParam],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.factory.createBlock([consoleLog, ifStatement], true)
  );

  const declaration = ts.factory.createVariableDeclaration(
    ts.factory.createIdentifier('handleUpdate'),
    undefined,
    undefined,
    arrowFunction
  );

  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList([declaration], ts.NodeFlags.Const)
  );
}

export function wrapReturnWithEditProvider(statement: ts.ReturnStatement): ts.ReturnStatement {
  if (!statement.expression) {
    return statement;
  }

  let expression = statement.expression;
  if (ts.isParenthesizedExpression(expression)) {
    expression = expression.expression;
  }

  if (
    ts.isJsxElement(expression) &&
    ts.isIdentifier(expression.openingElement.tagName) &&
    expression.openingElement.tagName.text === 'EditProvider'
  ) {
    return statement;
  }

  if (!ts.isJsxElement(expression) && !ts.isJsxFragment(expression) && !ts.isJsxSelfClosingElement(expression)) {
    return statement;
  }

  const wrapper = createEditProviderWrapper(expression as ts.JsxChild);
  const parenthesized = ts.factory.createParenthesizedExpression(wrapper);
  return ts.factory.updateReturnStatement(statement, parenthesized);
}

export function createEditProviderWrapper(child: ts.JsxChild): ts.JsxElement {
  const attributes = ts.factory.createJsxAttributes([
    createJsxAttribute('isEditMode', ts.factory.createIdentifier('isEditMode')),
    createJsxAttribute('onUpdate', ts.factory.createIdentifier('handleUpdate')),
    createJsxAttribute('basePath', ts.factory.createIdentifier('basePath'))
  ]);

  const opening = ts.factory.createJsxOpeningElement(
    ts.factory.createIdentifier('EditProvider'),
    undefined,
    attributes
  );
  const closing = ts.factory.createJsxClosingElement(ts.factory.createIdentifier('EditProvider'));
  return ts.factory.createJsxElement(opening, [child], closing);
}

export function createJsxAttribute(name: string, expression: ts.Expression): ts.JsxAttribute {
  return ts.factory.createJsxAttribute(
    ts.factory.createIdentifier(name),
    ts.factory.createJsxExpression(undefined, expression)
  );
}
