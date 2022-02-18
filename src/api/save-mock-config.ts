import http from "../utils/http"

interface Body {
  url: string
  method: string
  type: number
  config: string
}

function getMockConfig(data: Body) {
  return http<string>({
    url: "http://localhost:7788/mockConfig",
    method: "post",
    data,
  })
}

export default getMockConfig
