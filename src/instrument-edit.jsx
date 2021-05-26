import React from 'react'
import ReactDOM from 'react-dom'
import {getAvailableDataPaths} from './data-connection'
import Select from 'react-select'
import {updateInstrumentPanel} from './state'

const modalRoot = document.getElementById('modal')

const SIZE_TO_WIDTH = {
  '1 x 1': 1,
  '2 x 2': 2,
  '3 x 3': 3
}

function getPanelSize({width, height}) {
  if (width === 2 && height === 2) {
    return '2 x 2'
  }
  if (width === 3 && height === 3) {
    return '3 x 3'
  }
  return '1 x 1'
}

export default class InstrumentEdit extends React.Component {
  constructor(props) {
    super(props)
    this.state = {title: props.title, path: props.path, availablePaths: null, size: getPanelSize(props), selectedUnit: props.unit}
  }
  componentDidMount() {
    getAvailableDataPaths().then(availablePaths => {
      this.setState({availablePaths: availablePaths.map(p => ({value: p.key, label: p.key, meta: p.meta}))})
    })
  }

  submit(e) {
    e.preventDefault()
    const {path, size, title, selectedUnit} = this.state
    const width = SIZE_TO_WIDTH[size]
    updateInstrumentPanel(this.props.id, {path, width, height: width, scale: width, title, unit: selectedUnit})
    this.props.onClose()
  }

  renderPortalContent() {
    if (!this.state.availablePaths) {
      return <div>Spinneri</div>
    }

    const selectedPath = this.state.availablePaths.find(p => p.value === this.state.path)
    return (
      <React.Fragment>
      <div className="smokescreen" />
      <div className="instrument__edit">
        <form onSubmit={this.submit.bind(this)}>

          <div className="panel-size-selection">
            {[1,2,3].map(s => {
              const size = `${s} x ${s}`
              const isSelected = size === this.state.size
              return <div
                key={s}
                onClick={() => {this.setState({size})}}
                className={`panel-size-selection__block size-${s} ${isSelected ? 'selected' : ''}`}>
                  <span>{size}</span>
              </div>
            })}
          </div>

          <label>
            Title:
            <input type="text" value={this.state.title} onChange={(e) => this.setState({title: e.target.value})} />
          </label>

          <label>
            Path:
            <Select
              options={this.state.availablePaths}
              value={selectedPath}
              onChange={({value}) => this.setState({path: value, selectedUnit: null})}
              placeholder='Select data path'
              className='path-select'
              classNamePrefix="path-select"/>
          </label>

          {selectedPath && selectedPath.meta && selectedPath.meta.description && (
            <div className="instrument__edit__meta">
              {selectedPath.meta.description}
            </div>
          )}

          {this.renderUnitSelector(selectedPath)}
          <div className="instrument__edit__buttons">
            <button onClick={this.props.onClose}>Cancel</button>
            <input type="submit" value="Ok" disabled={!selectedPath}/>
          </div>
        </form>
      </div>
      </React.Fragment>
    )
  }

  render() {
    return ReactDOM.createPortal(
      this.renderPortalContent(),
      modalRoot
    )
  }

  renderUnitSelector(selectedPath) {
    const availableUnits = getFoo(selectedPath)
    if (availableUnits.length === 0) {
      return <div className="unit-selector" />
    }
    const selectedUnit = this.state.selectedUnit || availableUnits[0]
    return (
      <div className="unit-selector">
      {availableUnits.map(value => {
        const extraClass = selectedUnit === value ? 'selected' : ''
        return <div key={value} className={extraClass} onClick={() => this.setState({selectedUnit: value})}>{value}</div>
      })}
      </div>
    )
  }
}

function getFoo(selectedPath) {
  if (!selectedPath || !selectedPath.meta || !selectedPath.meta.units) {
    return []
  }
  const {units} = selectedPath.meta
  if (units === 'm/s') {
    return ['m/s', 'kts']
  }
  if (units === 'm') {
    return ['m', 'nm']
  }
  if (units === 'K') {
    return ['C', 'F']
  }
  return []
}
