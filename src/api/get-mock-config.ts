import http from "../utils/http"

interface Query {
  url: string
  method: string
  type: string
  config: string
}

function getMockConfig(query: Query) {
  return http<string>({
    url: "http://localhost:7788/mockConfig",
    method: "get",
    params: query,
  })
}

export default getMockConfig
