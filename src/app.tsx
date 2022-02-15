import { defineComponent, onBeforeMount, ref } from "vue"
import {
  DataTableColumn,
  NButton,
  NCode,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NInput,
  NList,
  NListItem,
  NTabPane,
  NTabs,
  NTag,
  NThing,
} from "naive-ui"
import hljs from "highlight.js/lib/core"
import typescript from "highlight.js/lib/languages/typescript"
import styles from "./app.module.scss"
import swagger, { ApiVO, GroupVO } from "./api/swagger"

hljs.registerLanguage("typescript", typescript)

const app = defineComponent({
  setup() {
    const swaggerRef = ref<GroupVO[]>([])
    const swaggerApiUrlRef = ref()
    const curApiRef = ref<ApiVO>()

    onBeforeMount(async () => {
      swaggerRef.value = await swagger(swaggerApiUrlRef.value)
      curApiRef.value = swaggerRef.value[0].apiVOs[0]
    })

    const methodTagMap: Record<string, "error" | "info" | "success" | "warning"> = {
      get: "success",
      post: "info",
      put: "warning",
      delete: "error",
    }

    const columns: DataTableColumn[] = [
      {
        title: "参数名称",
        key: "name",
        width: 400,
      },
      {
        title: "参数类型",
        key: "type",
        width: 160,
      },
      {
        title: "必需参数",
        key: "required",
        width: 160,
        render: (rowData) => (rowData.required ? "是" : "否"),
      },
      {
        title: "备注",
        key: "description",
      },
    ]

    return () => (
      <>
        <header class={styles.header}>
          <div class={styles.logo}>SwaggerCodegen</div>
          <div class={styles.right}>
            <div class={styles.input}>
              <NInput placeholder="请输入swagger文档api地址" />
            </div>
            <NButton type="primary" v-model={swaggerApiUrlRef.value}>
              加载文档
            </NButton>
          </div>
        </header>
        <main class={styles.main}>
          <aside class={styles.aside}>
            <NCollapse defaultExpandedNames={[0]}>
              {swaggerRef.value.map((item, index) => {
                return (
                  <NCollapseItem
                    name={index}
                    key={item.tag.name}
                    title={item.tag.name}
                    v-slots={{
                      "header-extra": () => item.tag.description,
                    }}
                  >
                    <NList bordered>
                      {item.apiVOs.map((api) => {
                        return (
                          <NListItem key={api.name}>
                            <div
                              onClick={() => {
                                curApiRef.value = api
                              }}
                            >
                              <NThing
                                titleExtra={api.name}
                                description={api.url}
                                v-slots={{
                                  header: () => <span class={styles[api.method]}>{api.method.toUpperCase()}</span>,
                                }}
                              />
                            </div>
                          </NListItem>
                        )
                      })}
                    </NList>
                  </NCollapseItem>
                )
              })}
            </NCollapse>
          </aside>
          <div class={styles.content}>
            <div class={styles["api-header"]}>
              <NTag type={methodTagMap[curApiRef.value?.method || ""]}>
                <b>{curApiRef.value?.method.toUpperCase()}</b>
              </NTag>
              <span class={styles.url}>{curApiRef.value?.url}</span>
            </div>
            <NThing title="接口信息" class={styles.thing}>
              <div class={styles.info}>
                <div>接口名称：{curApiRef.value?.name}</div>
                <div>接口描述：{curApiRef.value?.description}</div>
              </div>
            </NThing>
            <NTabs type="card" style={{ marginTop: "16px" }}>
              <NTabPane name={0} tab="接口定义">
                {curApiRef.value?.query?.length ? (
                  <>
                    <div>
                      <b>Query</b>
                    </div>
                    <NDataTable
                      bordered
                      singleLine={false}
                      columns={columns}
                      data={curApiRef.value.query}
                      class={styles.table}
                    />
                  </>
                ) : null}
                {curApiRef.value?.requestBody?.length ? (
                  <>
                    <div style="margin-top: 12px;">
                      <b>RequestBody</b>
                    </div>
                    <NDataTable
                      bordered
                      singleLine={false}
                      columns={columns}
                      data={curApiRef.value.requestBody}
                      class={styles.table}
                    />
                  </>
                ) : null}
                {curApiRef.value?.responseBody?.length ? (
                  <>
                    <div style="margin-top: 12px;">
                      <b>ResponseBody</b>
                    </div>
                    <NDataTable
                      bordered
                      singleLine={false}
                      columns={columns}
                      data={curApiRef.value.responseBody}
                      class={styles.table}
                      rowKey={(row) => row.name}
                    />
                  </>
                ) : null}
              </NTabPane>
              <NTabPane name={1} tab="请求代码">
                <NCode code={curApiRef.value?.code} hljs={hljs} language="typescript" />
              </NTabPane>
            </NTabs>
          </div>
        </main>
      </>
    )
  },
})

export default app
