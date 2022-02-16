import http from "../utils/http"

interface Tag {
  name: string
  description?: string
}

export interface GroupVO {
  tag: Tag
  apiVOs: ApiVO[]
}
interface TableRowVO {
  name: string
  type: string
  required: boolean
  description: string
  children?: TableRowVO[]
}

export interface ApiVO {
  method: string
  url: string
  name: string
  code: string
  query?: TableRowVO[]
  requestBody?: TableRowVO[][]
  responseBody?: TableRowVO[]
  summary?: string
  description?: string
  consumes?: string[]
  produces?: string[]
}

async function swagger(url: string) {
  return (await http.get<GroupVO[]>("http://localhost:7788/api/swagger")).data
}

export default swagger
