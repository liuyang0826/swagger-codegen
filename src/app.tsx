import { defineComponent, onBeforeMount, ref } from "vue"
import {
  DataTableColumn,
  NButton,
  NCode,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NIcon,
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
import json from "highlight.js/lib/languages/json"
import { Checkmark } from "@vicons/ionicons5"
import styles from "./app.module.scss"
import swagger, { ParsedRequestDefinition, Tag } from "./api/swagger"

hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("json", json)

interface ApiVO extends ParsedRequestDefinition {
  path: string
  method: string
}

interface Group {
  tag: Tag
  apiVOs: ApiVO[]
}

const app = defineComponent({
  setup() {
    const groupsRef = ref<Group[]>()
    const swaggerApiUrlRef = ref()
    const curApiRef = ref<ApiVO>()

    onBeforeMount(async () => {
      const { paths, tags } = await swagger(swaggerApiUrlRef.value)
      const tagMap = tags.reduce((acc, cur) => {
        acc[cur.name] = {
          tag: cur,
          apiVOs: [],
        }
        return acc
      }, {} as Record<string, Group>)
      Object.keys(paths).map((path) => {
        const curPath = paths[path]
        Object.keys(curPath).map((method) => {
          const curRequest = curPath[method]
          curRequest.tags.forEach((tag) => {
            const curMapValue = tagMap[tag]
            if (curMapValue) {
              curMapValue.apiVOs.push({
                ...curRequest,
                method,
                path,
              })
            }
          })
        })
      })
      groupsRef.value = Object.values(tagMap)
      curApiRef.value = groupsRef.value[0].apiVOs[0]
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
        render: ({ type, format }) => type + (format ? `(${format})` : ""),
      },
      {
        title: "必需参数",
        key: "required",
        width: 160,
        render: (rowData) =>
          rowData.required ? (
            <NIcon size={18} style={{ verticalAlign: "middle" }}>
              <Checkmark />
            </NIcon>
          ) : null,
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
              {groupsRef.value?.map((item, index) => {
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
                          <NListItem key={api.summary}>
                            <div
                              onClick={() => {
                                curApiRef.value = api
                              }}
                            >
                              <NThing
                                titleExtra={api.summary}
                                description={api.path}
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
              <span class={styles.url}>{curApiRef.value?.path}</span>
            </div>
            <NThing title="接口信息" class={styles.thing}>
              <div class={styles.info}>
                <div>
                  <span>接口名称：{curApiRef.value?.name}</span>
                  <span class={styles.summary}>接口摘要：{curApiRef.value?.summary}</span>
                </div>
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
                      size="small"
                      bordered
                      singleLine={false}
                      columns={columns}
                      data={curApiRef.value.query}
                      class={styles.table}
                      rowKey={(row) => row.id}
                    />
                  </>
                ) : null}
                {curApiRef.value?.requestBody?.map((requestBody) => {
                  return requestBody.length ? (
                    <>
                      <div style="margin-top: 12px;">
                        <b>RequestBody</b>
                      </div>
                      <NDataTable
                        size="small"
                        bordered
                        singleLine={false}
                        columns={columns}
                        data={requestBody}
                        class={styles.table}
                        rowKey={(row) => row.id}
                      />
                    </>
                  ) : null
                })}
                {curApiRef.value?.responseBody?.length ? (
                  <>
                    <div style="margin-top: 12px;">
                      <b>ResponseBody</b>
                    </div>
                    <NDataTable
                      size="small"
                      bordered
                      singleLine={false}
                      columns={columns}
                      data={curApiRef.value.responseBody}
                      class={styles.id}
                      rowKey={(row) => row.id}
                    />
                  </>
                ) : null}
              </NTabPane>
              <NTabPane name={1} tab="请求代码">
                <NCode code={curApiRef.value?.code} hljs={hljs} language="typescript" />
              </NTabPane>
              <NTabPane name={2} tab="Mock数据">
                <NCode code={curApiRef.value?.mock} hljs={hljs} language="json" />
              </NTabPane>
              <NTabPane name={3} tab="接口调试">
                <div>玩命开发中！！！</div>
              </NTabPane>
            </NTabs>
          </div>
        </main>
      </>
    )
  },
})

export default app
