// import axios from "axios"
import Koa from "koa"
import cors from "koa-cors"
import KoaRouter from "koa-router"
import koaStatic from "koa-static"
import LruCache from "lru-cache"
import parseSwagger, { ParsedSwagger, Swagger } from "./parse-swagger"
import swaggerJSon from "./swagger.json"
import mock from "./mock"
const app = new Koa()
const router = new KoaRouter()

function sleep(timeout: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, timeout)
  })
}

const lruCache = new LruCache<string, ParsedSwagger>({
  max: 1024 * 4,
})

lruCache.set("swagger", parseSwagger(swaggerJSon as Swagger))

app.use(cors())

router.get("/swagger", async (ctx) => {
  // const { data } = await axios.get<Swagger>(ctx.query.url as string)
  ctx.body = JSON.stringify(lruCache.get("swagger"))
})

app.use(router.routes())

// mock接口
app.use(async (ctx, next) => {
  const cache = lruCache.get("swagger")
  const responseBody = cache?.paths[ctx.path]?.[ctx.method.toLocaleLowerCase()]?.responseBody
  if (!responseBody) {
    return await next()
  }
  // 通过自定义header设置mock参数
  await sleep(Number(ctx.headers["mock-timeout"]) || 0)
  ctx.body = mock(responseBody)
})

app.use(koaStatic(`${__dirname}/static`))

app.listen("7788", () => {
  console.log(`server running at: http://localhost:${7788}`)
})
