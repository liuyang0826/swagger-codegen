import axios, { AxiosRequestConfig } from "axios"

async function http<T>(config: AxiosRequestConfig) {
  return (await axios(config)).data as T
}

export default http
