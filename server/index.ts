// import axios from "axios"
import Koa from "koa"
import cors from "koa-cors"
import KoaRouter from "koa-router"
import koaStatic from "koa-static"
import parseSwagger, { Swagger } from "./parse-swagger"
import swaggerJSon from "./swagger.json"
const app = new Koa()
const router = new KoaRouter()

app.use(cors())

router.get("/api/swagger", async (ctx) => {
  // const { data } = await axios.get<Swagger>(ctx.query.url as string)
  ctx.body = JSON.stringify(parseSwagger(swaggerJSon as Swagger))
})

app.use(koaStatic(`${__dirname}/static`))

app.use(router.routes())

app.listen("7788", () => {
  console.log(`server running at: http://localhost:${7788}`)
})
