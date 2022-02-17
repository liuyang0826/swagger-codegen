function copyValue(value: string) {
  const input = document.createElement("textarea")
  input.value = value
  document.body.appendChild(input)
  input.select()
  document.execCommand("copy", true)
  document.body.removeChild(input)
}

export default copyValue
