import React from 'react'
import GridLayout from 'react-grid-layout'
import {getDataStreamForPath} from './data-connection'
import formatcoords from 'formatcoords'
import Instrument from './instrument'
import {deleteInstrumentPanel, updateLayout} from './state'

const PANEL_SIZE = 200

export default class InstrumentsGrid extends React.Component {
  constructor(props) {
    super(props)
    this.state = {scale: 1, width: 1, height: 1}
  }
  componentDidMount() {
    window.addEventListener('resize', () => this.rescale())
    this.rescale()
  }
  rescale() {
    const maxScaleVertical = window.innerWidth / (this.props.columns * PANEL_SIZE)
    const maxScaleHorizontal = (window.innerHeight - 70) / (this.props.rows * PANEL_SIZE)
    const height = this.props.rows * PANEL_SIZE
    const width = this.props.columns * PANEL_SIZE
    this.setState({scale: Math.min(maxScaleHorizontal, maxScaleVertical), height, width})
  }
  componentDidUpdate(prevProps) {
    if (this.props.columns !== prevProps.columns || this.props.rows !== prevProps.rows) {
      this.rescale()
    }
  }
  render() {
    const {columns, rows, panels} = this.props
    const {height, width, scale} = this.state
    return (
      <div className='grid' style={{transform: `scale(${scale})`, transformOrigin: 'top left', height, width}}>
        <GridLayout
          className="layout instrument-grid"
          isDraggable={this.props.setup}
          cols={columns}
          rows={rows}
          rowHeight={PANEL_SIZE}
          width={PANEL_SIZE * columns}
          height={PANEL_SIZE * rows}
          autoSize={false}
          isResizable={false}
          margin={[0,0]}
          onLayoutChange={updateLayout}
          draggableHandle={'.drag'}
          compactType={null}
          transformScale={scale}
          preventCollision={true}
          isBounded={true}
          containerPadding={[0,0]}>
          {panels.map(panel =>
            <div key={`${panel.id}#${panel.x}-${panel.y}-${panel.width}-${panel.height}-${panel.path}`}data-grid={{x: panel.x, y: panel.y, w: panel.width, h: panel.width}}>
              <Instrument {...panel}
                setup={this.props.setup}
                onDelete={() => {deleteInstrumentPanel(panel.id)}}/>
            </div>
          )}
        </GridLayout>
      </div>
    )
  }
}
