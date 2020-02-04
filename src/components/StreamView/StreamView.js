import React from 'react'
import ReactJanusController from '../Janus/ReactJanusController';
import StreamController from './StreamController.js'
import {Container, Row, Col, Button, Form} from 'react-bootstrap'

class StreamView extends React.Component{
    constructor(props) {
        super(props);

        this.remoteStream = null

        this.state = {
            handlingName: false,
            haveName: false,
            remoteStreamStarted: false,
            haveRemoteStream: false,
            remoteStreamPlaying: false,
            remoteStreamDisconnected: false,
            haveRover: false,
        };

        //if we're rendering debug, fix some values
        if(props.debug) {
            //skip everything
        }
        else{
            this.streamId = props.match.params.id
            this.janusController = null;
            this.server = window.server
            this.streamingPlugin = 'janus.plugin.streaming'
            this.streamingPluginHandle = null
            this.rover = 'debug'
        }
      }

    async componentDidMount() {
        console.debug('StreamView Mounted')

        //don't bother to connect to janus if we're debugging
        if(this.props.debug)
            return

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
        console.log('StreamView OnMessageCallback', msg)
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
            console.log('StreamView JsepCallback', jsep)
            console.log(this.streamingPlugin)
            this.streamingPluginHandle.createAnswer(
                {
                    jsep: jsep,
                    media: { audioSend: false, videoSend: false, data: true },
                    success: (jsep)=> {
                        console.log("StreamView Jsep Answer Success")
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
            // Wait one second for reconnect, then error out
            setTimeout(()=>{
                if(this.state.remoteStreamDisconnected){
                    this.setState({
                        haveRemoteStream:false,
                        remoteStreamPlaying: false,
                        })
                }
            }, 1000)
            //this.setState({haveRemoteStream:false})
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
        this.rover = response.info.description
        this.setState({haveRover:true})
        console.log('rover', this.rover)
    }

    handleSubmit = (event) => {
        event.preventDefault();

        let form = event.target
        let name = form.elements.name.value

        if(!name || name === '') {
            alert("what's your name?");
            return
        }

        this.name = name
        this.setState({
            handlingName: true,
        })

        //feels weird if it happens instantly
        setTimeout(()=>{
            this.setState({haveName: true})
        }, 100)
    }

    render() {
        return (
            <>
            {this.props.debug ?
            <Container className='StreamView Debug p-2' ref='container'>
                <h1>sharing is caring - debug menu!</h1>
                <StreamController name='debug' rover='debug' debug={true}/>
            </Container>
            :
            <Container className='StreamView p-2' ref='container'>
                <Row className='p-2'>
                    <Col>
                        <Row>
                            <Col>
                                <h1>sharing is caring</h1>
                                <p>hi! i'm <strong style={{color: 'HotPink'}}>diana!</strong> i'm a robot you can drive 👾
                                </p>
                                <p>when i get bigger, i'm gonna clean plastic off the beach 🏖
                                </p>
                                <p>i'm a little robot but i have big dreams!
                                </p>
                                <p>what's your name?
                                </p>
                            </Col>
                        </Row>
                        <Form autoComplete="off" onSubmit={this.handleSubmit}>
                            <Form.Group as={Row} controlId="formName">
                                <Col xs="4">
                                    <Form.Control name='name' readOnly = {this.state.haveName ? true : false} type="text" placeholder={this.name}/>
                                </Col>
                                <Col xs="2">
                                    <Button disabled = {this.state.handlingName ? true : false} variant="dark" type="submit">
                                        start
                                    </Button>
                                </Col>
                            </Form.Group>
                        </Form>
                            
                    </Col>
                </Row>
                <Row className={(this.state.haveName ? 'p-2' : 'd-none')}>
                    <Col>
                        {this.state.haveRemoteStream ?
                        <video src={this.remoteStream} ref='videoRef' width="100%" id="stream" muted autoPlay playsInline/>
                        :
                        <div>
                            <h3>whoops! can't connect!</h3>
                            <h4>maybe i'm napping. try again later!</h4>
                        </div>
                        }
                    </Col>
                </Row>
                <Row className={(this.state.haveName ? 'p-2' : 'd-none')}>
                    <Col>
                        {this.state.remoteStreamPlaying && this.state.haveRover &&
                        <StreamController name={this.name} rover={this.rover} debug={false}/>
                        }
                    </Col>
                </Row>
            </Container>
            }
            </>
            
        );
    }
}

export default StreamView;