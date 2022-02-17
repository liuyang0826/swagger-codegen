import { defineComponent, onBeforeMount, ref } from "vue"
import {
  DataTableColumn,
  NButton,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NIcon,
  NInput,
  NList,
  NListItem,
  NRadio,
  NRadioGroup,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  NThing,
  useMessage,
} from "naive-ui"
import { Checkmark, CopyOutline } from "@vicons/ionicons5"
import swagger, { ParsedRequestDefinition, TableRowVO, Tag } from "../../api/swagger"
import CodeEditor from "../../components/code-editor"
import copyValue from "../../utils/copy-value"
import styles from "./index.module.scss"

interface ApiVO extends ParsedRequestDefinition {
  path: string
  method: string
}

interface Group {
  tag: Tag
  apiVOs: ApiVO[]
}

const Index = defineComponent({
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

    const columns: DataTableColumn<TableRowVO>[] = [
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
        width: 120,
        render: (rowData) =>
          rowData.required ? (
            <NIcon size={18} style={{ verticalAlign: "middle" }}>
              <Checkmark />
            </NIcon>
          ) : null,
      },
      {
        title: "可选值",
        key: "enum",
        width: 280,
        render: ({ enum: enums }) => (enums ? enums.join(", ") : null),
      },
      {
        title: "备注",
        key: "description",
      },
    ]
    const rowKey = (row: TableRowVO) => row.id

    const activeTabRef = ref(0)

    const copyUrl = () => {
      copyValue(curApiRef.value?.path || "")
      message.success("复制成功")
    }

    const copyCode = () => {
      if (codeTypeRef.value === 1) {
        copyValue(curApiRef.value?.tsCode || "")
      } else {
        copyValue(curApiRef.value?.jsCode || "")
      }
      message.success("复制成功")
    }

    const codeTypeRef = ref(1)
    const renderCodeTypeRadio = () => {
      return (
        <div class={styles["tabs-suffix"]}>
          <NButton size="tiny" bordered onClick={copyCode} style={{ marginRight: "16px" }}>
            复制代码
          </NButton>
          <NRadioGroup v-model:value={codeTypeRef.value}>
            <NSpace>
              <NRadio value={1}>typescript</NRadio>
              <NRadio value={2}>javascript</NRadio>
            </NSpace>
          </NRadioGroup>
        </div>
      )
    }

    const mockTypeRef = ref(1)
    const renderMockTypeRadio = () => {
      return (
        <NRadioGroup v-model:value={mockTypeRef.value}>
          <NSpace>
            <NRadio value={1}>JSON</NRadio>
            <NRadio value={2}>Mock</NRadio>
          </NSpace>
        </NRadioGroup>
      )
    }

    const suffixRenderMap: Record<number, () => JSX.Element> = {
      1: renderCodeTypeRadio,
      2: renderMockTypeRadio,
    }

    const message = useMessage()

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
              <NButton circle strong secondary type="primary" size="tiny" onClick={copyUrl}>
                <NIcon>
                  <CopyOutline />
                </NIcon>
              </NButton>
            </div>
            <NThing title="接口信息" class={styles.thing}>
              <div class={styles.info}>
                <div>
                  <span>接口名称：{curApiRef.value?.name}</span>
                  <span>接口摘要：{curApiRef.value?.summary}</span>
                  <span>接口描述：{curApiRef.value?.description}</span>
                </div>
                <div>
                  <span>请求数据类型：{JSON.stringify(curApiRef.value?.consumes || [])}</span>
                  <span>响应数据类型：{JSON.stringify(curApiRef.value?.produces || [])}</span>
                </div>
              </div>
            </NThing>
            <NTabs
              type="card"
              style={{ marginTop: "16px" }}
              v-model:value={activeTabRef.value}
              v-slots={{
                suffix: () => suffixRenderMap[activeTabRef.value]?.(),
              }}
            >
              <NTabPane name={0} tab="接口定义" displayDirective="show">
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
                      rowKey={rowKey}
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
                        rowKey={rowKey}
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
                      rowKey={rowKey}
                    />
                  </>
                ) : null}
              </NTabPane>
              <NTabPane name={1} tab="请求代码" displayDirective="show:lazy">
                <div class={styles["code-wrapper"]}>
                  <CodeEditor
                    key={codeTypeRef.value}
                    code={codeTypeRef.value === 1 ? curApiRef.value?.tsCode : curApiRef.value?.jsCode}
                    language={codeTypeRef.value === 1 ? "typescript" : "javascript"}
                    readOnly
                  />
                </div>
              </NTabPane>
              <NTabPane name={2} tab="Mock数据" displayDirective="show:lazy">
                <div class={styles["code-wrapper"]}>
                  <CodeEditor
                    code={mockTypeRef.value === 1 ? curApiRef.value?.mockJSON : curApiRef.value?.mockTemplate}
                    language="json"
                  />
                </div>
              </NTabPane>
              <NTabPane name={4} tab="接口调试" displayDirective="show:lazy">
                <div>玩命开发中！！！</div>
              </NTabPane>
            </NTabs>
          </div>
        </main>
      </>
    )
  },
})

export default Index
