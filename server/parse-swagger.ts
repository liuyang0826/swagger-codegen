import generate from "@babel/generator"

import {
  tsInterfaceDeclaration,
  tsInterfaceBody,
  identifier,
  tsPropertySignature,
  tsTypeAnnotation,
  tsStringKeyword,
  program,
  exportNamedDeclaration,
  addComment,
  tsNumberKeyword,
  tsTypeReference,
  TSTypeElement,
  tsArrayType,
  TSStringKeyword,
  TSNumberKeyword,
  TSArrayType,
  tsBooleanKeyword,
  TSBooleanKeyword,
  Program,
  importDeclaration,
  importDefaultSpecifier,
  stringLiteral,
  functionDeclaration,
  blockStatement,
  Identifier,
  returnStatement,
  callExpression,
  objectExpression,
  tsTypeParameterInstantiation,
  objectProperty,
  ObjectProperty,
  exportDefaultDeclaration,
  tsObjectKeyword,
  TSObjectKeyword,
} from "@babel/types"
import mock from "./mock"

type JavaBaseType = "integer" | "number" | "string" | "boolean"
type JavaType = JavaBaseType | "array" | "object"

interface DefinitionArrayItem {
  $ref?: string
  type?: JavaBaseType
}

interface Definition {
  required: string[]
  properties: Record<
    string,
    {
      type?: JavaType
      $ref?: string
      description?: string
      items?: DefinitionArrayItem
      format?: string
      enum?: (string | number)[]
    }
  >
}

interface Parameter {
  name: string
  in: "query" | "body"
  description: string
  required: boolean
  type: string
  format?: string
  allowEmptyValue: boolean
  schema?: {
    $ref: string
  }
}

interface RequestDefinition {
  tags: string[]
  summary: string
  description: string
  operationId: string
  parameters: Parameter[]
  responses: Record<
    "200",
    {
      description: string
      schema: {
        $ref: string
      }
    }
  >
}

export interface TableRowVO {
  id: number
  name: string
  type?: string
  format?: string
  required?: boolean
  enum?: (string | number)[]
  description?: string
  children?: TableRowVO[]
}

interface ParsedRequestDefinition {
  query?: TableRowVO[]
  requestBody?: TableRowVO[][]
  responseBody: TableRowVO[]
  code: string
  mock: string
  name: string
  tags: string[]
  summary: string
  description: string
}

interface Paths {
  [key: string]: Record<string, RequestDefinition>
}

interface ParsedPaths {
  [key: string]: Record<string, ParsedRequestDefinition>
}

interface Tag {
  name: string
  description?: string
}

export interface Swagger {
  tags: Tag[]
  paths: Paths
  definitions: Record<string, Definition>
}

export interface ParsedSwagger {
  tags: Tag[]
  paths: ParsedPaths
}

interface Context {
  definitionKeyCache: Record<string, 1>
  interfaceNameCache: Record<string, Record<string, number>>
  program: Program
  definitionKey: string
  definitions: Record<string, Definition>
  parameters: Parameter[]
  name: string
}

// 匹配引用类型的名称
function matchRefInterfaceName($ref?: string) {
  return $ref?.match(/#\/definitions\/(.+)/)?.[1]
}

function transformOperationId(operationId: string) {
  const index = operationId.indexOf("Using")
  return index === -1 ? operationId : operationId.slice(0, index)
}

function collectProgramBody(context: Context) {
  const { program, definitionKeyCache, interfaceNameCache, definitionKey, definitions, name, parameters } = context

  function transformInterfaceName(definitionKey: string) {
    const typeNameEndIndex = definitionKey.indexOf("«")
    const interfaceName = typeNameEndIndex === -1 ? definitionKey : definitionKey.slice(0, typeNameEndIndex)
    const curInterfaceNameCache = interfaceNameCache[interfaceName]
    if (!curInterfaceNameCache) {
      interfaceNameCache[interfaceName] = { [definitionKey]: 0 }
      return interfaceName
    }
    const definitionKeyCache = curInterfaceNameCache[definitionKey]
    if (definitionKeyCache !== undefined) {
      return interfaceName + (definitionKeyCache || "")
    } else {
      const index = Object.keys(curInterfaceNameCache).length
      curInterfaceNameCache[definitionKey] = index
      return interfaceName + index
    }
  }
  function javaTypeToTsKeyword(
    javaType: JavaType,
    item?: DefinitionArrayItem,
  ): TSStringKeyword | TSNumberKeyword | TSBooleanKeyword | TSArrayType | TSObjectKeyword | void {
    if (javaType === "string") {
      return tsStringKeyword()
    }
    if (["number", "integer"].includes(javaType)) {
      return tsNumberKeyword()
    }
    if (javaType === "boolean") {
      return tsBooleanKeyword()
    }
    if (javaType === "object") {
      return tsObjectKeyword()
    }
    if (javaType === "array") {
      const refDefinitionKey = matchRefInterfaceName(item?.$ref)
      resolveTsInterface(refDefinitionKey)
      const tsKeyword = refDefinitionKey
        ? tsTypeReference(identifier(transformInterfaceName(refDefinitionKey)))
        : item?.type
        ? javaTypeToTsKeyword(item?.type)
        : null
      if (tsKeyword) {
        return tsArrayType(tsKeyword)
      }
    }
  }

  function resolveTsInterface(definitionKey?: string) {
    if (!definitionKey || !definitions[definitionKey] || definitionKeyCache[definitionKey]) {
      return
    }
    const { properties } = definitions[definitionKey]
    const interfaceBody: Array<TSTypeElement> = []
    Object.keys(properties).forEach((propName) => {
      const { type, $ref, description, items } = properties[propName]
      const refDefinitionKey = matchRefInterfaceName($ref)
      resolveTsInterface(refDefinitionKey)
      const tsKeyword = refDefinitionKey
        ? tsTypeReference(identifier(transformInterfaceName(refDefinitionKey)))
        : type
        ? javaTypeToTsKeyword(type, items)
        : null
      if (!tsKeyword) {
        console.log(`the ${propName} attribute of the ${definitionKey} is ignored`)
        return
      }
      const node = {
        ...tsPropertySignature(identifier(propName), tsTypeAnnotation(tsKeyword)),
        optional: true,
      }
      interfaceBody.push(description ? addComment(node, "trailing", ` ${description}`, true) : node)
    })

    const interfaceName = transformInterfaceName(definitionKey)

    const exportInterface = exportNamedDeclaration(
      tsInterfaceDeclaration(identifier(interfaceName), null, null, tsInterfaceBody(interfaceBody)),
    )

    definitionKeyCache[definitionKey] = 1
    program.body.push(exportInterface)

    return interfaceName
  }

  function resolveQuery() {
    const interfaceBody: Array<TSTypeElement> = []
    const interfaceName = `${name.charAt(0).toUpperCase() + name.slice(1)}Query`
    parameters.forEach((parameter) => {
      if (parameter.in !== "query") {
        return
      }
      const { name, description, required, type, schema } = parameter
      const refDefinitionKey = matchRefInterfaceName(schema?.$ref)
      resolveTsInterface(refDefinitionKey)
      const tsKeyword = refDefinitionKey
        ? tsTypeReference(identifier(transformInterfaceName(refDefinitionKey)))
        : type
        ? javaTypeToTsKeyword(type as JavaType)
        : null
      if (!tsKeyword) {
        console.log(`the ${name} attribute of the ${interfaceName} is ignored`)
        return
      }
      const node = {
        ...tsPropertySignature(identifier(name), tsTypeAnnotation(tsKeyword)),
        optional: !required,
      }
      interfaceBody.push(description ? addComment(node, "trailing", ` ${description}`, true) : node)
    })

    if (!interfaceBody.length) {
      return ""
    }

    const exportInterface = exportNamedDeclaration(
      tsInterfaceDeclaration(identifier(interfaceName), null, null, tsInterfaceBody(interfaceBody)),
    )

    program.body.push(exportInterface)

    return interfaceName
  }

  let id = 1

  function resolveTableRaws(definitionKey?: string) {
    if (!definitionKey || !definitions[definitionKey]) {
      return []
    }
    const { properties, required } = definitions[definitionKey]
    const tableRaws: TableRowVO[] = []
    Object.keys(properties).forEach((propName) => {
      const { type, $ref, description, items, format, enum: enums } = properties[propName]
      tableRaws.push({
        id: id++,
        name: propName,
        type: type || "object",
        format,
        description,
        required: required.includes(propName),
        enum: enums,
        children:
          type === "array"
            ? [
                {
                  id: id++,
                  name: "[Array Item]",
                  type: items?.type || "object",
                  required: true,
                  children: resolveTableRaws(matchRefInterfaceName(items?.$ref)),
                },
              ]
            : resolveTableRaws(matchRefInterfaceName($ref)),
      })
    })

    return tableRaws
  }

  const refDefinitionKeys = parameters
    .filter((d) => d.in === "body" && d.schema?.$ref)
    .map((d) => matchRefInterfaceName(d.schema?.$ref))

  const requestBody = refDefinitionKeys.map((refDefinitionKey) => resolveTableRaws(refDefinitionKey))
  id = 1
  const responseBody = resolveTableRaws(definitionKey)

  return {
    resInterface: resolveTsInterface(definitionKey),
    queryInterface: resolveQuery(),
    bodyInterfaces: refDefinitionKeys.map((refDefinitionKey) => resolveTsInterface(refDefinitionKey) as string),
    requestBody,
    responseBody,
  }
}

function parseSwagger(swagger: Swagger): ParsedSwagger {
  const { paths, definitions, tags } = swagger

  return {
    tags,
    paths: Object.keys(paths).reduce((acc1, path) => {
      const curPath = paths[path]
      acc1[path] = Object.keys(curPath).reduce((acc2, method) => {
        const curRequest = curPath[method]
        const definitionKey = matchRefInterfaceName(curRequest.responses["200"].schema?.$ref)
        if (!definitionKey) {
          return acc2
        }
        const { operationId, parameters, summary, description, tags } = curRequest

        const name = transformOperationId(operationId)

        const context = {
          definitionKeyCache: {},
          interfaceNameCache: {},
          program: program([
            importDeclaration([importDefaultSpecifier(identifier("http"))], stringLiteral("@utils/http")),
          ]),
          definitions,
          definitionKey,
          parameters,
          name,
        }

        const { resInterface, queryInterface, bodyInterfaces, requestBody, responseBody } = collectProgramBody(context)

        const apiFunction = functionDeclaration(
          identifier(name),
          [
            queryInterface && {
              ...identifier("query"),
              typeAnnotation: tsTypeAnnotation(tsTypeReference(identifier(queryInterface))),
            },
            bodyInterfaces.length && {
              ...identifier("data"),
              typeAnnotation: tsTypeAnnotation(tsTypeReference(identifier(bodyInterfaces[0]))),
            },
          ].filter(Boolean) as Identifier[],
          blockStatement([
            returnStatement({
              ...callExpression(identifier("http"), [
                objectExpression(
                  [
                    objectProperty(identifier("url"), stringLiteral(path)),
                    objectProperty(identifier("method"), stringLiteral(method)),
                    queryInterface && objectProperty(identifier("params"), identifier("query")),
                    bodyInterfaces.length && objectProperty(identifier("data"), identifier("data"), false, true),
                  ].filter(Boolean) as ObjectProperty[],
                ),
              ]),
              typeParameters: resInterface
                ? tsTypeParameterInstantiation([tsTypeReference(identifier(resInterface))])
                : null,
            }),
          ]),
        )

        if (summary || description) {
          addComment(apiFunction, "leading", ` ${[summary, description].filter(Boolean).join(", ")}`, true)
        }

        context.program.body.push(apiFunction, exportDefaultDeclaration(identifier(name)))

        const code = generate(context.program).code.replace(/\n\n/g, "\n").replace(/;/g, "")

        acc2[method] = {
          description,
          name,
          summary,
          tags,
          query: curRequest.parameters
            .filter((d) => d.in === "query")
            .map((item, index) => {
              const { name, type, format, required, description } = item
              return {
                id: index + 1,
                name,
                type: type || "object",
                format,
                required,
                description,
              }
            }),
          requestBody,
          responseBody,
          code,
          mock: JSON.stringify(mock(responseBody), null, 2),
        }
        return acc2
      }, {} as Record<string, ParsedRequestDefinition>)
      return acc1
    }, {} as Record<string, Record<string, ParsedRequestDefinition>>),
  }
}

export default parseSwagger
