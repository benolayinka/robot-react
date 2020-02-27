import React from 'react';

const scoreBoardStyle = {
    marginLeft: '50%'
}


class ScoreBoard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      score: 0,
      cap: 3 //should depend on the vehicule , 
      //maybe something like an unloading station would be cool
    };
  }

  //this will be relevant when the redux paradigm is implemented
  /*update() { 
  	this.state.setState({ score: this.score + 1 });
  }*/ 

  render(props) {
    return (<h3 id="scoreboard" style={scoreBoardStyle}> Trash picked up: 
    		<span id="score">{this.state.score}</span>
    		&nbsp; 
    		&nbsp; 
    		Cap: <span id="capacity">{this.state.cap}</span>
    	</h3> );
  }
}


export default ScoreBoard

