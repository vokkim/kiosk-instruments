import React from 'react'
import ReactDOM from 'react-dom'
import {getCurrentUser, login} from './data-connection'
import InstrumentsGrid from './instruments-grid'
import {subscribe, initialState, addInstrumentPanel, init, addColumn, removeColumn, addRow, removeRow} from './state'


const params = new URLSearchParams(window.location.search)
const isInKioskMode = params.has('kiosk')
const username = params.get('username')
const password = params.get('password')

class App extends React.Component {
  constructor() {
    super()
    this.state = {setup: false, user: undefined, showLogin: false, loginError: false}
  }
  async componentDidMount() {
    subscribe(state => this.setState(state))

    if (username && password) {
      window.location.search.replace('')
      try {
        await login(username, password)
      } catch(e) {
        this.setState({loginError: true})
        return
      }
    }
    const user = await getCurrentUser()
    if (!user) {
      window.location.href = '/admin/#/login'
    } else {
      init()
      this.setState({user})
    }
  }
  render() {
    if (this.state.loginError) {
      return <div>Login error</div>
    }
    if (!this.state.user || !this.state.panels) {
      return <div>Loading</div>
    }
    return (
      <div className={`${this.state.setup ? 'setup' : ''}`}>
        <InstrumentsGrid {...this.state}/>
        {this.renderMenu()}
      </div>
    )
  }

  renderMenu() {
    if (isInKioskMode) {
      return null
    }
    if (!this.state.setup) {
      return (
        <div className="menu">
          <button onClick={() => this.setState({setup: true})}>Edit</button>
          <div className="spacer" />
          <div className="user">{this.state.user}</div>
        </div>
      )
    }
    return (
      <div className="menu">
        <button onClick={() => this.setState({setup: false})}>Done</button>
        <button onClick={() => addInstrumentPanel()}>+ Add</button>
        <div className="button-group">
          <label>Columns:</label>
          <button onClick={() => removeColumn()}>-</button>
          <span>{this.state.columns}</span>
          <button onClick={() => addColumn()}>+</button>
        </div>
        <div className="button-group">
          <label>Rows:</label>
          <button onClick={() => removeRow()}>-</button>
          <span>{this.state.rows}</span>
          <button onClick={() => addRow()}>+</button>
        </div>
        <div className="spacer" />
        <div className="user">{this.state.user}</div>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'))