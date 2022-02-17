import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import { NMessageProvider } from "naive-ui"

const app = defineComponent({
  setup() {
    return () => (
      <NMessageProvider>
        <RouterView />
      </NMessageProvider>
    )
  },
})

export default app
