async function parseResponse(response) {
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  const result = await response.text()
  if (result.length === 0) {
    return undefined
  }
  try {
    return JSON.parse(result)
  } catch(e) {
    throw new Error(`Non-empty response: ${result}`)
  }
}

export async function get(url) {
  try {
    const response = await fetch(url)
    return await parseResponse(response)
  } catch(e) {
    console.error(`Error on GET ${url}`, e)
    throw e
  }
}

export async function post(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    })
    return await parseResponse(response)
  } catch(e) {
    console.error(`Error on POST ${url}`, e)
    throw e
  }
}

export async function put(url, data) {
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: data !== undefined ? JSON.stringify(data) : undefined
    })
    return await parseResponse(response)
  } catch(e) {
    console.error(`Error on PUT ${url}`, e)
    throw e
  }
}
