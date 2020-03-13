import React from 'react';
import {Container, Row, Col} from 'react-bootstrap'

class ScoreBoard extends React.Component {
  constructor(props) {
    super(props);
  }

  //this will be relevant when the redux paradigm is implemented
  /*update() { 
  	this.state.setState({ score: this.score + 1 });
  }*/ 

  render(props) {
    return (
    <div className='w-100 h-100 position-absolute'>
      <Container className='p-3' fluid>
        <h3 id="scoreboard" className="threeD text-center">
            <span>Trash picked up: </span>
            <span id="score">{this.props.score}</span>
            <span id="capacity" style={{visible: false}}>{this.props.score}</span>
        </h3>
      </Container>
    </div>
    );
  }
}

ScoreBoard.defaultProps = {
  score: 0,
  cap: 0,
}

export default ScoreBoard

