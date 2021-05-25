import React from 'react'
import formatcoords from 'formatcoords'
import InstrumentEdit from './instrument-edit'
import {subscribeForPath} from './data-connection'
import {RemoveIcon, EditIcon} from './icons'

const UNIT_TO_LABEL = {
  'deg': '°',
  'C': '°C',
  'F': '°F',
  'm': 'm',
  'km': 'km',
  'nm': 'nm',
  'm/s': 'm/s',
  'kts': 'kts',
  'V': 'V',
  'A': 'A',
  'coordinate': '',
  'duration': '',
  'timestamp': ''
}

const ISO_DATE_TIME_REGEX = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/

export default class Instrument extends React.Component {
  constructor(props) {
    super(props)
    this.state = {value: undefined, edit: this.props.path === undefined}
  }
  async componentDidMount() {
    this.unsub = await subscribeForPath(this.props.path, (a) => this.setState({value: a.value, units: a.meta.units}))
  }
  componentWillUnmount() {
    this.unsub && this.unsub()
  }
  render() {
    const {value, unit} = this.getCurrentValueAndUnit()
    return (
      <div className="instrument" style={{fontSize: `${this.props.scale || 1}rem`}}>
        <div className="instrument__title-row">
          <div className="instrument__title">{this.props.title}</div>
          <div className="instrument__unit">{UNIT_TO_LABEL[unit]}</div>
        </div>
        <div className="instrument__value">{this.renderValue(value, unit)}</div>
        {this.props.setup && <div className="drag"></div>}
        {this.props.setup && this.renderSetupButtons()}
        {this.state.edit && <InstrumentEdit {...this.props} onClose={() => this.setState({edit: false})}/>}
      </div>
    )
  }

  getCurrentValueAndUnit() {
    if (this.state.value === undefined) {
      return {value: '-', unit: undefined}
    }

    if (this.state.value && this.state.value.latitude && this.state.value.longitude) {
      return {value: this.state.value, unit: 'coordinate'}
    }
    if (typeof this.state.value === 'string') {
      if (ISO_DATE_TIME_REGEX.test(this.state.value)) {
        return {value: new Date(this.state.value), unit: 'timestamp'}
      }
      return {value: this.state.value, unit: undefined}
    }
    if (isFinite(this.state.value)) {
      if (this.state.units === 'm/s' && this.props.unit === 'kts') {
        return {value: this.state.value * 1.943844, unit: 'kts'}
      }
      if (this.state.units === 'm/s') {
        return {value: this.state.value, unit: 'm/s'}
      }
      if (this.state.units === 'K' && this.props.unit === 'F') {
        return {value: (9/5)*(this.state.value - 273) + 32, unit: 'F'}
      }
      if (this.state.units === 'K') {
        return {value: this.state.value - 273.15, unit: 'C'}
      }
      if (this.state.units === 'm' && this.props.unit === 'nm') {
        return {value: this.state.value * 0.0005399568, unit: 'nm'}
      }
      if (this.state.units === 'm' && this.state.value > 900) {
        return {value: this.state.value / 1000, unit: 'km'}
      }
      if (['m', 'V', 'A'].includes(this.state.units)) {
        return {value: this.state.value, unit: this.state.units}
      }
      if (this.state.units === 'rad') {
        return {value: (180 / Math.PI) * this.state.value, unit: 'deg'}
      }
      if (this.state.units === 's') {
        const hours = Math.floor(this.state.value / 60 / 60)
        const minutes = Math.floor(this.state.value / 60) - (hours * 60)
        const seconds = this.state.value % 60

        return {value: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, unit: 'duration'}
      }
    }
    return {value: this.state.value, unit: undefined}
  }

  renderValue(value, unit) {
    if (unit === 'coordinate') {
      const formatted = formatcoords(value.latitude, value.longitude).format('FFf')
      const splitIndex = formatted.search(/[SN]/) + 1
      return (
        <div className="value__coordinates">
          <div>{formatted.substring(0, splitIndex)}</div>
          <div>{formatted.substring(splitIndex)}</div>
        </div>
      )
    }
    if (unit === 'timestamp') {
      return (
        <div className="value__timestamp">
          <div>{value.toISOString().substring(0, 10)}</div>
          <div>{value.toISOString().substring(11,19)}</div>
        </div>
      )
    }
    if (['m/s', 'kts', 'm', 'C', 'V', 'A', 'nm', 'km'].includes(unit)) {
      return renderWithDecimals(value)
    }
     if (['deg', 'F'].includes(unit)) {
      return <span>{value.toFixed(0)}</span>
    }
    if (typeof value === 'object') {
      return <span className="long-value">Not supported</span>
    }
    const asStr = (value === undefined ? '-' : value).toString()
    const extraClass = asStr.length > 5 ? 'long-value' : ''
    return <span className={extraClass}>{asStr}</span>
  }

  renderSetupButtons() {
    return (
      <div className="instrument__buttons">
        <button onClick={() => this.setState({edit: true})}><EditIcon /></button>
        <button onClick={() => this.props.onDelete()}><RemoveIcon /></button>
      </div>
    )
  }
}

function renderWithDecimals(value) {
  const splitted = value.toFixed(1).split('.')
  if (splitted.length === 2) {
    const extraClass = splitted[0].length > 3 ? 'long-value' : ''
    return (
      <span className={`instrument__value__split ${extraClass}`}>
        <span>{splitted[0]}.</span><span className="instrument__value__decimals">{splitted[1]}</span>
      </span>
    )
  }
  return <span>{value}</span>
}