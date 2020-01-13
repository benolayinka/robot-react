import React from 'react'
import StreamGamepad from './StreamGamepad.js'
import StreamWsClient from './StreamWsClient.js'

export default class StreamController extends React.Component {
    constructor(props) {
		super(props)
		this.userSent = false
		this.pressed = {}
		this.gamepadData = {}
		this.controlLoopRunning = false
		this.wsClient = new StreamWsClient('wss://benolayinka.com/ws')
		this.wsClient.connect();
	}
	
	componentDidMount() {
		this.controlLoop()
	}

    sendUser() {
		if(!this.userSent) {
			this.userSent = true;
			let json = JSON.stringify({event:"userConnected", user:this.props.user})
			this.wsClient.send(json)
		}
	}

	sendStop(){
		let json = JSON.stringify({
			rover: this.props.rover,
			event: 'stop',
			user: this.props.user
		})
		this.wsClient.send(json);
	}

	sendKeysPressed(){
		let json = JSON.stringify({
			rover: this.props.rover,
			event: 'keysPressed',
			pressed: Object.keys(this.pressed),
			user: this.props.user
		})
		this.wsClient.send(json);
		console.debug('Sending keys pressed', json)
	}

	//keypresses bound to joystick commands
	bindKeysPressed() {
		onkeydown=function(e){
		 e = e || window.event;
		 this.pressed[e.key] = true;
		 this.sendKeysPressed()
		}
	
		onkeyup=function(e){
		 e = e || window.event;
		 delete this.pressed[e.key];
		 this.sendKeysPressed()
		}
	
		document.addEventListener('keydown', onkeydown);
		document.addEventListener('keyup', onkeyup);
	}

	sendControls(){
		let json = JSON.stringify({
			rover: this.props.rover,
			event: 'controls',
			data: this.gamepadData,
			user: this.props.user
		})
		this.wsClient.send(json)
	}

	 // Send control updates to the server every .1 seconds.
	controlLoop () {
		setTimeout(() => {
			this.controlLoop()
			if (this.controlLoopRunning) {
				this.sendControls()
			}
		}, 100)
	}

	gamepadCallback = ({active, gamepadElementData}) => {
		// if(active){
		// 	this.gamepadData = {...this.gamepadData, ...gamepadElementData}
		// }
		// else{
		// 	//remove the element if inactive
		// 	delete this.gamepadData[Object.keys(gamepadElementData)[0]]
		// }

		this.gamepadData = {...this.gamepadData, ...gamepadElementData}

		if(Object.entries(this.gamepadData).length !== 0){
			this.controlLoopRunning = true
		}
		else{
			this.controlLoopRunning = false
		}

		//this.gamepadData = {...this.gamepadData, ...gamepadElementData}
		
		// manager.on('start', function(evt, data) {
		// 	joystickLoopRunning=true;
		// 	joystickLoop();
		//   }).on('end', function(evt, data) {
		// 	joystickLoopRunning=false;
		// 	sendStop()
		//   }).on('move', function(evt, data) {
		// 	joystickData = data;
		//   });
    }

	render() {
		return(
			<div>
				{this.props.renderControls && <StreamGamepad onMove={this.gamepadCallback} width={this.props.width} leftStick='true' rightStick='true'/>}
			</div>
		)
	}
}