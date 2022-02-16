import { Random } from "mockjs"

interface RandomItem {
  name: string
  type?: string
  enum?: (string | number)[]
  children?: RandomItem[]
}

function mock(raw: RandomItem | RandomItem[]): any {
  if (Array.isArray(raw)) {
    return raw.reduce((acc, cur) => {
      acc[cur.name] = mock(cur)
      return acc
    }, {} as Record<string, any>)
  } else if (raw.enum?.length) {
    return raw.enum[~~(Math.random() * raw.enum.length)]
  } else {
    if (raw.type === "string") {
      return Random.string(10)
    } else if (raw.type === "number") {
      return Random.integer()
    } else if (raw.type === "integer") {
      return Random.integer()
    } else if (raw.type === "boolean") {
      return Random.boolean()
    } else if (raw.type === "object") {
      return mock(raw.children || [])
    } else if (raw.type === "array") {
      if (!raw.children?.length) {
        return []
      }
      return Random.range(1, 4, 1).map(() => mock(raw.children?.[0] as RandomItem))
    }
  }
}

export default mock
