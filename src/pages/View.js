import React from 'react'
import './View.scss'
import ViewIntro from '../components/ViewIntro'
import Gamepad from '../components/Gamepad'
import Controller from '../components/Controller'
import SVG from '../components/Svg'
import Box from '../components/Box'
import ReactJanusController from '../components/ReactJanusController'
import Colors from '../styles/Colors.scss'
import Div100vh from 'react-div-100vh'
import {getQuery} from '../scripts/utils'
import Loading from '../components/Loading'

export default class View extends React.Component{
    constructor(props) {
        super(props);

        //if query parameter includes ?debug=true
        const query = getQuery();
        this.debug = 'debug' in query

        console.log(props.match.params.id)

        this.remoteStream = null

        this.gamepadData = {
            driveJoystickData: {x:0, y:0},
            lookJoystickData: {x:0, y:0},
            buttonsPressed: {0:false, 1:false, 2:false},
            keysPressed: {},
        }

        this.controller = new Controller({
            debug: true,
            name: 'debug',
            rover: 'debug',
            gamepadData: this.gamepadData,
        })

        this.state = {
            width: null,
            haveName: false,
            remoteStreamStarted: false,
            haveRemoteStream: null, //false means stream doesn't exist
            remoteStreamPlaying: false,
            remoteStreamDisconnected: false,
            haveRover: false,
        };

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
        this.setState({width:this.refs.container.clientWidth})

        //force component to remount on resize
        window.addEventListener('resize', ()=>{
            this.setState({width:null}, ()=>{
                this.setState({width:this.refs.container.clientWidth})
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
            this.refs.videoRef.addEventListener("playing",
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
        this.setState({haveRover:true})
    }

    render() {
        return (
            /*<Div100vh className='View full'>*/
            <div className='View full'>
                {!this.debug && <Loading
                                    loadingElement={'connecting'}
                                    failedElement={'whoops! cant connect'}
                                    loaded={this.state.haveRemoteStream === true}
                                    failed={this.state.haveRemoteStream === false}
                                    timeout={1200}
                                    zIndex={9999}
                                    />
                                    }
                {!this.debug && <ViewIntro zIndex={9998} />}
                <div className = "video-container" ref="container">
                    <div className = "video-container-inner">
                        <video src={this.remoteStream} ref='videoRef' muted autoPlay playsInline/>
                    </div>
                    <div className = "video-container-inner">
                        {this.state.width &&
                            <Gamepad className='gamepad' onEvent={this.onGamepadEvent} nippleSize={Math.max(this.state.width/6, 100)} buttonSize={Math.max(this.state.width/15, 40)}/>
                        } 
                    </div>
                    <div className = "video-container-deco">
                        <Box height='40vw' backgroundColor={Colors.whiteTrue} left="-10%" top="50%" />
                        <Box height='40vw' backgroundColor={Colors.whiteTrue} left="70%" top="-20%" />
                        <div className = "video-label top threeD">
                            GOOD ROBOT - HYENA 👾
                        </div>   
                        <div className = "video-label bottom threeD">
                            LET'S CLEAN UP THE WORLD 👾
                        </div> 
                    </div>
                </div>
            </div>
            /*</Div100vh>*/
        )
    }
}