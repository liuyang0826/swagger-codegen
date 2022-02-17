import http from "../utils/http"

export interface TableRowVO {
  id: number
  name: string
  type?: string
  format?: string
  required?: boolean
  description?: string
  enum?: (string | number)[]
  children?: TableRowVO[]
}

export interface ParsedRequestDefinition {
  query?: TableRowVO[]
  requestBody?: TableRowVO[][]
  responseBody: TableRowVO[]
  tsCode: string
  jsCode: string
  mockJSON: string
  mockTemplate: string
  name: string
  tags: string[]
  produces?: string[]
  consumes?: string[]
  summary: string
  description: string
}

interface ParsedPaths {
  [key: string]: Record<string, ParsedRequestDefinition>
}

export interface Tag {
  name: string
  description?: string
}

interface ParsedSwagger {
  tags: Tag[]
  paths: ParsedPaths
}

async function swagger(url: string) {
  return (await http.get<ParsedSwagger>("http://localhost:7788/swagger")).data
}

export default swagger
