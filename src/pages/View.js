import React from 'react'
import {Modal, Button, Overlay, Tooltip} from 'react-bootstrap'
import './View.scss'
import KidsIntro from '../components/KidsIntro'
import ReactJanusController from '../components/ReactJanusController'
import Colors from '../styles/Colors.scss'
import Div100vh from 'react-div-100vh'
import {getQuery} from '../scripts/utils'
import Loading from '../components/Loading'
import io from 'socket.io-client'
import StreamControllerUserList from '../components/StreamControllerUserList.js'
import ReactNipple from 'react-nipple'
const uuidv1 = require('uuid/v1'); 

const controlStates = {
    AVAILABLE: 'available',
    REQUESTING: 'requesting',
    UNAVAILABLE: 'unavailable',
    HAVE: 'have' 
}

const controlTexts = {
    AVAILABLE: 'Touch me to drive for 30 seconds!',
    REQUESTING: 'Requesting',
    UNAVAILABLE: 'Unavailable',
	HAVE: 'Ok!', 
}

const hudText = (user, state, timeLeft) => {
    var name
    if(user) name = user.name
    else name = 'Nobody'

    switch(state) {
        case controlStates.AVAILABLE:
            return 'Nobody is driving'
            break;
        case controlStates.REQUESTING:
            return 'Requesting...'
            break;
        case controlStates.UNAVAILABLE:
        case controlStates.HAVE:
            return name + ' is driving. ' + timeLeft + ' seconds left.'
            break;
        default:
            return 'Nobody is driving'
            break;
    }
}

export default class View extends React.Component{
    constructor(props) {
        super(props);

        this.driveRef = React.createRef();
        this.videoContainerRef = React.createRef();
        this.videoRef = React.createRef();

        this.state = {
            width: null,
            haveName: false,
            remoteStreamStarted: false,
            haveRemoteStream: null, //false means stream doesn't exist
            remoteStreamPlaying: false,
            remoteStreamDisconnected: false,
            haveRover: false,
            controlState:controlStates.AVAILABLE,
			controlText:controlTexts.AVAILABLE,
			usersInRoom: null,
			activeUserInRoom: null,
            showModal: false,
            timeLeft: null,
            showUsers: false,
            showEndTimer: false,
            showDriveTooltip: true,
        };

        //if query parameter includes ?debug=true
        const query = getQuery();
        this.debug = 'debug' in query

        if(this.debug){
			this.uuid = 'debug'
            this.name = "debug"
            this.rover = "debug"
            this.user = {name: this.name, uuid: this.uuid}
            this.state.haveName = true
        }
		else
			this.uuid = uuidv1();

        this.controlLoopRunning = false

        this.remoteStream = null

        this.gamepadData = {
            driveJoystickData: {x:0, y:0},
            lookJoystickData: {x:0, y:0},
            buttonsPressed: {0:false, 1:false, 2:false},
            keysPressed: {},
        }

        this.streamId = props.match.params.id
        this.janusController = null;
        this.server = window.server
        this.streamingPlugin = 'janus.plugin.streaming'
        this.streamingPluginHandle = null
        this.rover = 'none'
    }

    onGamepadEvent = (evt, data) => {
        if(evt === 'driveJoystick'){
            this.gamepadData.driveJoystickData = data
        }
        else if(evt === 'lookJoystick'){
            this.gamepadData.lookJoystickData = data
        }
        else if(evt === 'button'){
            this.gamepadData.buttonsPressed[data.button] = data.pressed
        }
        else if(evt === 'mouse'){

        }
        else if(evt === 'key'){
            this.gamepadData.keysPressed[data.key] = data.pressed
        }
	}

    async componentDidMount() {

        //nipplejs doesn't work unless we window resize https://github.com/yoannmoinet/nipplejs/issues/39
        window.dispatchEvent(new Event("resize"));

        this.setState({width:this.videoContainerRef.current.clientWidth})

        //force component to remount on resize
        window.addEventListener('resize', ()=>{
            this.setState({width:null}, ()=>{
                this.setState({width:this.videoContainerRef.current.clientWidth})
            })
        })

        //connect to janus
        var janusController = new ReactJanusController()
        this.janusController = janusController
        await this.janusController.init(this.server)
        this.streamingPluginHandle = await this.janusController.attachPlugin(this.streamingPlugin)
        this.janusController.attachCallback(this.streamingPlugin, 'onmessage', this.onMessageCallback)
        this.janusController.attachCallback(this.streamingPlugin, 'onremotestream', this.onRemoteStreamCallback)
        this.getRoverFromStream();
        this.watchStream();
    }

    onMessageCallback = (msg, jsep)=> {
        var result = msg["result"];
        if(result !== null && result !== undefined) {
            if(result["status"] !== undefined && result["status"] !== null) {
                var status = result["status"];
                if(status === 'starting')
                    console.log('StreamView OnMessage Starting')
                else if(status === 'started')
                    this.setState({remoteStreamStarted:true})
                else if(status === 'stopped')
                    console.log('StreamView OnMessage Stopped')
            }
        }
        if(jsep !== undefined && jsep !== null) {
            this.streamingPluginHandle.createAnswer(
                {
                    jsep: jsep,
                    media: { audioSend: false, videoSend: false, data: true },
                    success: (jsep)=> {
                        var body = { "request": "start" };
                        this.streamingPluginHandle.send({"message": body, "jsep": jsep});
                    },
                    error: (error) => {
                        console.error("WebRTC error:", error);
                    }
                });
        }
    }

    onRemoteStreamCallback = (stream) => {
        console.debug('StreamView OnRemoteStreamCallback', stream)
        var videoTracks = stream.getVideoTracks();
        if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
            console.debug('StreamView OnRemoteStreamCallback No Remote Video Track Found')
            // No remote video
            this.setState({remoteStreamDisconnected:true})
            // Wait for reconnect, then error out
            setTimeout(()=>{
                if(this.state.remoteStreamDisconnected){
                    this.setState({
                        haveRemoteStream:false,
                        })
                }
            }, 3000)
        } else {
            console.debug('StreamView OnRemoteStreamCallback Remote Video Track Found')
            this.remoteStream = window.URL.createObjectURL(stream)
            this.setState({
                haveRemoteStream:true,
                remoteStreamDisconnected: false,
                })

            //video resizes window, so render stuff after
            this.videoRef.current.addEventListener("playing",
                 ()=> { this.setState({remoteStreamPlaying:true}) }, true);
        }
    }

    watchStream = async () => {
        let body = {
            request: 'watch',
            id: parseInt(this.streamId)
        }
        var response = await this.janusController.sendMessage(this.streamingPlugin, body)
    }

    stopStream = async () => {
        let body = { "request": "stop" };
	    let response = await this.janusController.sendMessage(this.streamingPlugin, body)
    }

    getRoverFromStream = async () => {
        
        if (this.debug){
            this.rover = "debug"
            this.setState({haveRover:true}, this.openSocket)
            return
        } 

        let body = {
            request: 'info',
            id: parseInt(this.streamId)
        }
        var response = await this.janusController.sendMessage(this.streamingPlugin, body)
        if(!response.info) {
            console.error('no stream', response)
            return
        }
        this.rover = response.info.description
        this.setState({haveRover:true}, this.openSocket)
    }

    closeConnection() {
        clearInterval(this.controlLoop)
        this.controlLoopRunning=false
        this.socket.close()
    }

	updateUsersByRooms = (usersByRooms)=>{
		//get users just in our room
        //console.log('users', usersByRooms)
		this.setState({usersInRoom: usersByRooms[this.rover]})
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
		this.setState({timeLeft: message.secondsRemaining})

        if(message.secondsRemaining <= 3 && message.secondsRemaining >= 1){
            this.setState({showEndTimer:true})
        } else {
            this.setState({showEndTimer:false})
        }

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
				name: this.name,
				uuid: this.uuid,
			})

		//join room for rover
		this.socket.emit('join', this.rover, (response)=>{
			//console.log('join room response: ' + response)
		})
	}
	
	onRequestButton = ()=>{
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

    onGotName = (name)=>{
        this.name = name
        this.user = {name: this.name, uuid: this.uuid}
        this.setState({haveName:true}, this.openSocket)
    }

    hideModal = ()=>{
		this.setState({showModal:false})
	}

	showModal = ()=>{
		this.setState({showModal:true})
	}

    openSocket = ()=>{
        if(this.state.haveName && this.state.haveRover){
            this.socket = io()
		    this.socket.on('connect', this.onSocketConnect);
        }
    }

    showUsers = ()=> {
        this.setState({showUsers:true})
    }

    hideUsers = ()=> {
        this.setState({showUsers:false})
    }

    getUsefulJoystickData = (evt, data) => {
        if(evt.type === 'move'){
            let size = data.instance.options.size
            let centerX = data.instance.position.x
            let centerY = data.instance.position.y

            //scale both axes to plus minus 90 degrees
            let normalX = Math.trunc( 180 * (data.position.x - centerX) / size)
            //y axis is flipped, up is negative
            let normalY = Math.trunc (-180 * (data.position.y - centerY) / size)
            return {x:normalX, y:normalY}
        } else if (evt.type === 'end') {
            return {x:0, y:0}
        }
    }

    handleDriveJoystick = (event, data) => {
        this.setState({showDriveTooltip:false})
        this.handleJoystick('driveJoystick', event, data)
    }

    handleJoystick = (joystick, event, data) => {
        let evt = joystick
        let dat = this.getUsefulJoystickData(event, data)
        this.handleEvent(evt, dat)
    }

    handleEvent = (event, data) => {
        this.onGamepadEvent(event, data)
    }

    render() {

        const nippleSize = Math.max(this.state.width/6, 100)

        const nippleOptions = {
            color: 'transparent',
            size: nippleSize,
            mode: 'static',
            restOpacity: 1,
            fadeTime: 0,
            position: {top: '50%', left:'50%'}
        }

        return (
            <Div100vh>
                <div className='View overflow-hidden position-absolute h-100 w-100'>
                    {!this.debug && <KidsIntro onGotName={this.onGotName} zIndex={9998} />}
                    <Modal
                        centered
                        show={this.state.showModal}
                        onHide={this.hideModal}
                    >
                        <Modal.Header closeButton className = 'no-border'>
                            <Modal.Title className = 'px-4 pt-4'>
                                <h3>Diana, the trash collecting robot</h3>
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="container px-4">
                                <img class = "mb-4 w-50" src="/images/ben-robot.jpg" />
                                <p>Diana the robot began as an idea Ben had a long, long time ago, growing up in Ibadan, Nigeria.</p>
                                <p>Where Ben grew up there's trash EVERYWHERE. You're always walking over plastic bags, kicking over plastic bottles, it's terrible.</p>
                                <p>As a young computer nerd, Ben thought, why not use robots to clean up all that trash, since people won't?</p>
                                <p>We are a still a long way away from self-driving trash eating robots, but what if you could give a few minutes to drive a robot and help clean up trash somewhere else in the world?</p>
                                <p>One day, Diana is gonna get big enough to clean up all the trash in Ibadan, Nigeria, and eventually all over the world.</p>
                                <p>If you wanna chat about the robot, send Ben an email: <strong className="font-weight-bold">ben@thekids.eu</strong></p>
                            </div>
                        </Modal.Body>
                    </Modal>
                    <img src="/images/egghead.png" className="logo" />
                    <button onClick={this.showModal} className="btn-naked robotinfo kids-view-link">Learn more about the robot</button>
                    <p className="chat"><span className="animated-rainbow-text">Video chat with me at<span>&nbsp;</span></span><a className="kids-view-link font-weight-bold" target="_blank" href="https://whereby.com/kidscreativeagency">whereby.com/kidscreativeagency</a>!</p>
                    <p className="tagline">Merry xmas from Diana the robot! 🎅🎄</p>
                    <div className = "video-container" ref={this.videoContainerRef}>
                        <span className="chat-phone"><span className="animated-rainbow-text">Video chat with me at<span>&nbsp;</span></span><a className="kids-view-link font-weight-bold" target="_blank" href="https://whereby.com/kidscreativeagency">whereby.com/kidscreativeagency</a>!</span>
                        <div className = 'd-flex s-3 position-absolute align-items-center p-4 t-0 l-0 z-9'>
                            <span className = 'text-white text-shadow px-3'>{hudText(this.state.activeUserInRoom, this.state.controlState, this.state.timeLeft)}</span>
                        </div>
                        <div className = 'd-flex flex-column align-items-end s-3 position-absolute p-4 t-0 r-0 z-9'>
                            <Button 
                                className="btn-dropdown"
                                variant="light"
                                onClick={this.state.showUsers ? this.hideUsers : this.showUsers}>
                                <img className="w-100" src="/images/online.svg" />
                            </Button>
                            {
                            this.state.showUsers &&
                            <div className="user-list z-9">
                                <div className="container p-4">
                                <button type="button" className="close" onClick={this.hideUsers}>
                                    <span aria-hidden="true">×</span>
                                    <span className="sr-only">Close</span>
                                </button>
                                <StreamControllerUserList userList={this.state.usersInRoom} activeUser={this.state.activeUserInRoom}/>
                                </div>    
                            </div>
                            }
                        </div>
                        <div className='z-9 w-100 h-100 p-2 d-flex justify-content-center align-items-center text-center'>
                            {(this.state.controlState === controlStates.AVAILABLE || this.state.controlState === controlStates.REQUESTING) &&
                            <Button
                                className = 'position-absolute s-3 z-9 text-center no-border'
                                size="lg"
                                disabled={this.state.controlState !== controlStates.AVAILABLE}
                                onClick={this.onRequestButton}
                            >
                                <span className='text-white'>{this.state.controlText}</span>
                            </Button>
                            }
                            {this.state.showEndTimer  &&
                                <h1 className="z-9 end-timer text-white font-weight-bold text-shadow display-4">{this.state.timeLeft}</h1>
                            }
                        </div>
                        <div className = "video-container-inner">
                            <video src={this.remoteStream} ref={this.videoRef} muted autoPlay playsInline/>
                            {this.state.width && this.state.controlState === controlStates.HAVE &&
                            <div className="p-4 position-absolute h-100 w-100 t-0 l-0">
                                {/* relative inner container respects padding */}
                                <div className="position-relative h-100 w-100">
                                    <div ref={this.driveRef}
                                        className = 'position-absolute b-0 r-0'
                                        style = {{width: nippleSize, height: nippleSize}}
                                        >
                                    </div>
                                    <ReactNipple
                                        options={nippleOptions}
                                        className='DriveJoystick position-absolute b-0 r-0'
                                        onMove={this.handleDriveJoystick}
                                        onEnd={this.handleDriveJoystick}
                                        style = {{width: nippleSize, height: nippleSize}}
                                    />
                                    <Overlay target={this.driveRef.current} show={this.state.showDriveTooltip} placement="left">
                                        {(props) => (
                                        <Tooltip {...props}>
                                            Move me to drive!
                                        </Tooltip>
                                        )}
                                    </Overlay>
                                </div>
                            </div>
                            }
                        </div>
                    </div>
                </div>
            </Div100vh>
        )
    }
}