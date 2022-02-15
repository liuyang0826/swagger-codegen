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
} from "@babel/types"

type JavaBaseType = "integer" | "number" | "string" | "boolean"
type JavaType = JavaBaseType | "array"

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

interface Paths {
  [key: string]: Record<
    string,
    {
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
  >
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

interface Context {
  definitionKeyCache: Record<string, 1>
  interfaceNameCache: Record<string, Record<string, number>>
  program: Program
  definitionKey: string
  definitions: Record<string, Definition>
  parameters: Parameter[]
  name: string
}

interface GroupVO {
  tag: Tag
  apiVOs: ApiVO[]
}

interface TableRowVO {
  name?: string
  type?: string
  required?: boolean
  description?: string
  children?: TableRowVO[]
}

interface ApiVO {
  method: string
  url: string
  name: string
  code: string
  query?: TableRowVO[]
  requestBody?: TableRowVO[]
  responseBody?: TableRowVO[]
  summary?: string
  description?: string
  consumes?: string[]
  produces?: string[]
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
  ): TSStringKeyword | TSNumberKeyword | TSBooleanKeyword | TSArrayType | void {
    if (javaType === "string") {
      return tsStringKeyword()
    }
    if (["number", "integer"].includes(javaType)) {
      return tsNumberKeyword()
    }
    if (javaType === "boolean") {
      return tsBooleanKeyword()
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

  function resolveTableRaws(definitionKey?: string) {
    if (!definitionKey || !definitions[definitionKey]) {
      return []
    }
    const { properties, required } = definitions[definitionKey]
    const tableRaws: TableRowVO[] = []
    Object.keys(properties).forEach((propName) => {
      const { type, $ref, description, items, format } = properties[propName]
      tableRaws.push({
        name: propName,
        type: type ? type + (format ? `(${format})` : "") : "object",
        description,
        required: required.includes(propName),
        children:
          type === "array"
            ? [
                {
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

  const refDefinitionKey = matchRefInterfaceName(parameters.find((d) => d.in === "body")?.schema?.$ref)

  return {
    resInterface: resolveTsInterface(definitionKey),
    queryInterface: resolveQuery(),
    bodyInterface: resolveTsInterface(refDefinitionKey),
    requestBody: resolveTableRaws(refDefinitionKey),
    responseBody: resolveTableRaws(definitionKey),
  }
}

function makeImportDeclaration() {
  return importDeclaration([importDefaultSpecifier(identifier("http"))], stringLiteral("@utils/http"))
}

function parseSwagger(swagger: Swagger): GroupVO[] {
  const { paths, definitions, tags } = swagger

  const tagMap = tags.reduce((acc, cur) => {
    acc[cur.name] = {
      tag: cur,
      apiVOs: [],
    }
    return acc
  }, {} as Record<string, GroupVO>)

  function parsePaths(paths: Paths) {
    Object.keys(paths).forEach((url) => {
      const curUrl = paths[url]
      Object.keys(curUrl).forEach((method) => {
        const curRequest = curUrl[method]
        const definitionKey = matchRefInterfaceName(curRequest.responses["200"].schema?.$ref)
        if (!definitionKey) {
          return
        }
        const { operationId, parameters, summary, description } = curRequest

        const name = transformOperationId(operationId)

        const context = {
          definitionKeyCache: {},
          interfaceNameCache: {},
          program: program([makeImportDeclaration()]),
          definitions,
          definitionKey,
          parameters,
          name,
        }

        const { resInterface, queryInterface, bodyInterface, requestBody, responseBody } = collectProgramBody(context)

        const apiFunction = functionDeclaration(
          identifier(name),
          [
            queryInterface && {
              ...identifier("query"),
              typeAnnotation: tsTypeAnnotation(tsTypeReference(identifier(queryInterface))),
            },
            bodyInterface && {
              ...identifier("data"),
              typeAnnotation: tsTypeAnnotation(tsTypeReference(identifier(bodyInterface))),
            },
          ].filter(Boolean) as Identifier[],
          blockStatement([
            returnStatement({
              ...callExpression(identifier("http"), [
                objectExpression(
                  [
                    objectProperty(identifier("url"), stringLiteral(url)),
                    objectProperty(identifier("method"), stringLiteral(method)),
                    queryInterface && objectProperty(identifier("params"), identifier("query")),
                    bodyInterface && objectProperty(identifier("data"), identifier("data"), false, true),
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
          addComment(apiFunction, "leading", ` ${[summary, description].join(", ")}`, true)
        }

        context.program.body.push(apiFunction, exportDefaultDeclaration(identifier(name)))

        const code = generate(context.program).code.replace(/\n\n/g, "\n").replace(/;/g, "")

        tagMap[curRequest.tags[0]].apiVOs.push({
          method,
          url,
          name,
          query: curRequest.parameters
            .filter((d) => d.in === "query")
            .map((item) => {
              const { name, type, format, required, description } = item
              return {
                name,
                type: type ? type + (format ? `(${format})` : "") : "object",
                required,
                description,
              }
            }),
          requestBody,
          responseBody,
          summary,
          description,
          code,
        })
      })
    })
  }

  parsePaths(paths)

  return Object.values(tagMap)
}

export default parseSwagger
