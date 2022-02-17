import { createApp } from "vue"
import App from "./app"
import "./styles/base.scss"
import router from "./router"

const app = createApp(App)

app.use(router)

app.mount("#app")
