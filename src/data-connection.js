import Client from '@signalk/client'
import {get, post} from './api'

let subscriptionPathQueue = []
let listeners = []

const client = new Client({
  hostname: 'localhost',
  port: 3000,
  useTLS: false,
  reconnect: true,
  autoConnect: true,
  notifications: false,
  subscriptions: [],
})

client.on('connect', () => {
  if (subscriptionPathQueue.length) {
    client.subscribe([
      {
        context: 'vessels.self',
        subscribe: [...new Set(subscriptionPathQueue)].map(path => ({
          path,
          policy: 'fixed',
          period: 1000
        }))
      }
    ])
    subscriptionPathQueue = []
  }
})

export async function getCurrentUser() {
  const response = await get(`/loginStatus`)
  const user = response.status === "loggedIn" ? response.username : undefined
  if (user && response.userLevel === 'read') {
    console.error(`Requires read/write permissions`)
    return undefined
  }
  return user
}

export async function login(username, password) {
  await post(`/signalk/v1/auth/login`, { username, password, rememberMe: true })
  return true
}
export async function logout(serverUrl) {
  await put(`/signalk/v1/auth/logout`)
  return true
}

export async function getStoredConfigurationFromServer() {
  const result = await get('/signalk/v1/applicationData/user/arbuusi-instruments/1.0/config')
  return result
}

export async function storeConfigurationToServer(data) {
  const result = await post('/signalk/v1/applicationData/user/arbuusi-instruments/1.0/config', data)
}

function getMetadata(path) {
  return client.API().then((api) => api.getMeta('vessels.self.' + path))
}

export function getAvailableDataPaths() {
  return client.API().then((api) => api.self()).then(parseDataPaths)
}

function parseDataPaths(data, prefix = '') {
  return Object.keys(data).reduce((acc, k) => {
    if (k === 'uuid') {
      return acc
    }
    const dataForKey = data[k]
    const key = prefix + k
    if (dataForKey.timestamp || dataForKey.value !== undefined) {
      return acc.concat([{key, meta: dataForKey.meta}])
    }
    return acc.concat(parseDataPaths(dataForKey, key + '.'))
  }, [])
}

export async function subscribeForPath(path, cb) {
  const meta = await getMetadata(path)
  if (!client.connection.connected) {
    subscriptionPathQueue.push(path)
  } else {
    client.subscribe([
      {
        context: 'vessels.self',
        subscribe: [
          {
            path,
            policy: 'fixed',
            period: 1000
          },
        ],
      },
    ])
  }
  const listener = (delta) => {
    const update = delta.updates[0]
    const matchingValues = update.values.filter(value => value.path === path)
    if (matchingValues.length === 1) {
      cb({...matchingValues[0], meta})
    }
  }
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

client.on('delta', (delta) => {
  listeners.forEach(listener => listener(delta))
})

