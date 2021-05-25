import { v4 as uuidv4 } from 'uuid'
import {storeConfigurationToServer, getStoredConfigurationFromServer} from './data-connection'

const emptyState = {
  rows: 2,
  columns: 2,
  panels: []
}

let state = undefined
/*
const state = {
  rows: 4,
  columns: 4,
  fontSize: 2,
  panels: [
    {
      id: '5',
      x: 0,
      y: 1,
      width: 2,
      height: 2,
      scale: 2,
      path: 'navigation.speedOverGround',
      title: 'SOG',
      unit: 'kts'
    },
  ]
}*/

export function addColumn() {
  state.columns = Math.min(10, state.columns + 1)
  notify()
}

export function removeColumn() {
  state.columns = Math.max(2, state.columns - 1)
  notify()
}

export function addRow() {
  state.rows = Math.min(10, state.rows + 1)
  notify()
}

export function removeRow() {
  state.rows = Math.max(2, state.rows - 1)
  notify()
}

export function updateLayout(items) {
  state.panels = state.panels.map(panel => {
    const layoutItem = items.find(({i}) => i.split('#')[0] === panel.id)
    if (layoutItem && panel.path) {
      return {...panel, x: layoutItem.x, y: layoutItem.y}
    }
    return panel
  })
  notify()
}

export function addInstrumentPanel() {
  state.panels = state.panels.concat([{
    id: uuidv4(),
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    scale: 1,
    path: undefined,
    title: ''
  }])
  notify()
}

export function updateInstrumentPanel(instrumentId, data) {
  state.panels = state.panels.map(panel => {
    if (panel.id === instrumentId) {
      return {...panel, ...data}
    }
    return panel
  })
  notify()
}

export function deleteInstrumentPanel(instrumentId) {
  state.panels = state.panels.filter(({id}) => id !== instrumentId)
  notify()
}

const subscriptions = []
export function subscribe(cb) {
  subscriptions.push(cb)
}

function notify() {
  for (const cb in subscriptions) {
    subscriptions[cb](state)
  }
  storeConfiguration()
}


export async function init() {
  if (state === undefined) {
    const storedSate = await getStoredConfigurationFromServer()
    state = storedSate || emptyState
    notify()
  }
}


let storeDebounce = null
function storeConfiguration() {
  if (storeDebounce) {
    return
  }
  storeDebounce = setTimeout(() => {
    const onlyValidPanels = state.panels.filter(({path}) => path !== undefined)
    storeConfigurationToServer({...state, panels: onlyValidPanels})
    storeDebounce = null
  }, 1000)
}
