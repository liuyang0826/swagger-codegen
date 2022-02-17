import { defineComponent, onBeforeUnmount, onMounted, PropType, ref, toRaw, watch } from "vue"
import { editor, KeyMod, KeyCode } from "monaco-editor"
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") {
      return new jsonWorker()
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker()
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker()
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker()
    }
    return new editorWorker()
  },
}

const CodeEditor = defineComponent({
  props: {
    code: String as PropType<string>,
    language: String as PropType<string>,
    readOnly: Boolean as PropType<boolean>,
    onUpdateCode: Function as PropType<(code: string) => void>,
  },
  setup(props) {
    const rootRef = ref<HTMLDivElement>()
    const instanceRef = ref<editor.IStandaloneCodeEditor>()
    onMounted(() => {
      if (!rootRef.value) {
        return
      }
      const instance = editor.create(rootRef.value, {
        value: props.code,
        language: props.language,
        folding: true,
        showFoldingControls: "mouseover",
        readOnly: props.readOnly,
        scrollbar: {
          arrowSize: 4,
        },
        // theme: "vs-dark",
      })
      instanceRef.value = instance
      const onUpdateCode = props.onUpdateCode
      if (onUpdateCode) {
        instance.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, () => {
          onUpdateCode(toRaw(instanceRef.value)?.getValue() || "")
        })
      }
    })

    onBeforeUnmount(() => {
      toRaw(instanceRef.value)?.dispose()
    })

    watch(
      () => props.code,
      () => {
        toRaw(instanceRef.value)?.setValue(props.code || "")
      },
    )

    return () => <div ref={rootRef} style={{ height: "100%" }} />
  },
})

export default CodeEditor
