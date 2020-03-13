import io from 'socket.io-client'
const uuidv1 = require('uuid/v1'); 

const controlStates = {
    AVAILABLE: 'available',
    REQUESTING: 'requesting',
    UNAVAILABLE: 'unavailable',
    HAVE: 'have' 
}

const controlTexts = {
    AVAILABLE: 'touch me to drive!',
    REQUESTING: 'requesting',
    UNAVAILABLE: 'unavailable',
	HAVE: 'ok!', 
}

export default class Controller {
    constructor(props) {

        this.props = props

		this.gamepadData = props.gamepadData
		
		this.controlLoopRunning = false

		if(this.props.debug)
			this.uuid = 'debug'
		else
			this.uuid = uuidv1();

		this.user = {name: this.props.name, uuid: this.uuid}

		this.socket = io()
		this.socket.on('connect', this.onSocketConnect);

		this.state = {
			controlState:controlStates.AVAILABLE,
			controlText:controlTexts.AVAILABLE,
			usersInRoom: null,
			activeUserInRoom: null
		}
	}

    setState(state) {
        Object.assign(this.state, state)
    }

    closeConnection() {
        clearInterval(this.controlLoop)
        this.controlLoopRunning=false
        this.socket.close()
    }

	updateUsersByRooms = (usersByRooms)=>{
		//get users just in our room
		this.setState({usersInRoom: usersByRooms[this.props.rover]})
	}

	handleRequestAck = (message)=>{
		if(message.uuid === this.uuid) {
			if(message.requestGranted){
				this.setState({
					controlState:controlStates.HAVE,
					controlText:controlTexts.HAVE,
					})
			} else {
				this.setState({controlState:controlStates.UNAVAILABLE})
			}
		}
	}

	handleSecondsRemaining = (message)=>{
		//get the index of the active user from the uuid of the seconds message
		let userIndex = this.state.usersInRoom.map(function(user) { return user.uuid; })
					.indexOf(message.uuid);

		//set activeuser if found
		if (userIndex >= 0) {
				let user = this.state.usersInRoom[userIndex]
				this.setState({activeUserInRoom: user})
		}

		//update state based on who is using
		if(message.uuid === this.uuid) {
			this.setState({controlState:controlStates.HAVE})
		} else {
			this.setState({controlState:controlStates.UNAVAILABLE})
		}

		//update control text
		this.setState({controlText: 'time left: ' + message.secondsRemaining})

		//update state when time expires
		if(message.secondsRemaining === 0){
			this.setState({
				controlText:controlTexts.AVAILABLE,
				controlState:controlStates.AVAILABLE,
				activeUserInRoom: null,
			})
		}
	}

	handleAvailable = () => {
		this.setState({
			controlText:controlTexts.AVAILABLE,
			controlState:controlStates.AVAILABLE,
			activeUserInRoom: null,
		})
	}

	onSocketConnect = () => {
		this.socket.on('users by rooms', (usersByRooms) => this.updateUsersByRooms(usersByRooms))

		this.socket.on('message', (message)=> {
			//console.log('message received', message)
			switch(message.type) {
				case 'request ack':
					this.handleRequestAck(message)
					break
				case 'seconds remaining':
					this.handleSecondsRemaining(message)
					break
				case 'available':
					this.handleAvailable()
					break
				default:
					// code block
				}
		})

		//defining and using all program logic within connected context..
		this.sendControls = () => {
			this.socket.emit('message', {
				type: 'controls',
				data: this.gamepadData,
				uuid: this.uuid
			})
		}

		let controlLoopFunc = ()=>{
			if (this.state.controlState !== controlStates.UNAVAILABLE) {
				this.sendControls()
			}
		}

		// Send control updates to the server every .1 seconds.
		this.controlLoop = setInterval(controlLoopFunc, 100)

		this.socket.emit('user connected', {
				name: this.props.name,
				uuid: this.uuid,
			})

		//join room for rover
		this.socket.emit('join', this.props.rover, (response)=>{
			console.log('join room response: ' + response)
		})
	}
	
	requestControl = ()=>{
		this.setState({
			controlText:controlTexts.REQUESTING,
			controlState:controlStates.REQUESTING
			})
		//also need to check for user, give request an id
		this.socket.emit('message', {
			type: 'request',
			uuid: this.uuid,
		})

		//if we don't get an ack, become available again after 5 seconds
		setTimeout(()=>{
			if(this.state.controlState === controlStates.REQUESTING){
				this.setState({
					controlState:controlStates.AVAILABLE,
					controlText:controlTexts.AVAILABLE,
					})
			}
		}, 5000)

	}
}