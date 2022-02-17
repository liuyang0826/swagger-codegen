interface RandomItem {
  name: string
  type?: string
  enum?: (string | number)[]
  children?: RandomItem[]
}

export function toMockTemplate(raw: RandomItem | RandomItem[]): any {
  if (Array.isArray(raw)) {
    return raw.reduce((acc, cur) => {
      acc[cur.name] = toMockTemplate(cur)
      return acc
    }, {} as Record<string, any>)
  } else if (raw.enum?.length) {
    return raw.enum[~~(Math.random() * raw.enum.length)]
  } else {
    if (raw.type === "string") {
      return "@string()"
    } else if (raw.type === "number") {
      return "@integer()"
    } else if (raw.type === "integer") {
      return "@integer()"
    } else if (raw.type === "boolean") {
      return "@boolean()"
    } else if (raw.type === "object") {
      return toMockTemplate(raw.children || [])
    } else if (raw.type === "array") {
      if (!raw.children?.length) {
        return []
      }
      return [toMockTemplate(raw.children?.[0] as RandomItem)]
    }
  }
}

export default toMockTemplate
