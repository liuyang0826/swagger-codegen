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
} from "@babel/types"

import swaggerJSON from "./swagger.json"

type JavaBaseType = "integer" | "string" | "boolean"
type JavaType = JavaBaseType | "array"

type DefinitionArrayItem = {
  $ref?: string
  type?: JavaBaseType
}

type Definitions = Record<
  string,
  {
    properties: Record<
      string,
      {
        type?: JavaType
        $ref?: string
        description?: string
        items?: DefinitionArrayItem
      }
    >
  }
>

// 匹配引用类型的名称
function matchRefTypeName($ref?: string) {
  return $ref?.match(/#\/definitions\/(.+)/)?.[1]
}

// java类型转ts类型
function javaTypeToTsKeyword(
  javaType: JavaType,
  item?: DefinitionArrayItem,
): TSStringKeyword | TSNumberKeyword | TSBooleanKeyword | TSArrayType | void {
  if (javaType === "string") {
    return tsStringKeyword()
  }
  if (javaType === "integer") {
    return tsNumberKeyword()
  }
  if (javaType === "boolean") {
    return tsBooleanKeyword()
  }
  if (javaType === "array") {
    const refTypeName = matchRefTypeName(item?.$ref)
    const tsKeyword = refTypeName
      ? tsTypeReference(identifier(refTypeName))
      : item?.type
      ? javaTypeToTsKeyword(item?.type)
      : null
    if (tsKeyword) {
      return tsArrayType(tsKeyword)
    }
  }
}

function definitionsToTs(definitions: Definitions) {
  const programBody = Object.keys(definitions).map((interfaceName) => {
    const { properties } = definitions[interfaceName]
    const interfaceBody: Array<TSTypeElement> = []
    Object.keys(properties).forEach((propName) => {
      const { type, $ref, description, items } = properties[propName]
      const refTypeName = matchRefTypeName($ref)
      const tsKeyword = refTypeName
        ? tsTypeReference(identifier(refTypeName))
        : type
        ? javaTypeToTsKeyword(type, items)
        : null
      if (!tsKeyword) {
        console.log(`the ${propName} attribute of the ${interfaceName} is ignored`)
        return
      }
      const node = {
        ...tsPropertySignature(identifier(propName), tsTypeAnnotation(tsKeyword)),
        optional: true,
      }
      interfaceBody.push(description ? addComment(node, "trailing", ` ${description}`, true) : node)
    })
    return exportNamedDeclaration(
      tsInterfaceDeclaration(identifier(interfaceName), null, null, tsInterfaceBody(interfaceBody)),
    )
  })
  const ast = program(programBody)
  return generate(ast).code.replace(/\n\n/g, "\n").replace(/;/g, "")
}

console.log(definitionsToTs(swaggerJSON.definitions as Definitions))
