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
            haveRemoteStream: false,
            renderControls: false,
            name: null,
        };

        //if we're rendering debug, fix some values
        if(props.debug) {
            this.name = 'debug'
            this.rover = 'debug'
            this.state.handlingName = true
            this.state.haveName = true
            this.state.renderControls = true
        }
        else{
            this.streamId = props.match.params.id
            this.janusController = null;
            this.server = window.server
            this.streamingPlugin = 'janus.plugin.streaming'
            this.streamingPluginHandle = null
            this.rover = 'mars'
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
        this.watchStream();
    }

    onMessageCallback = (msg, jsep)=> {
        console.log('StreamView OnMessageCallback', msg)
        if(jsep !== undefined && jsep !== null) {
            console.log('StreamView JsepCallback', jsep)
            console.log(this.streamingPlugin)
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
            // No remote video
            //disabling haveremotestream causes really annoying re rendering
            //this.setState({haveRemoteStream:false})
        } else {
            this.remoteStream = window.URL.createObjectURL(stream)
            this.setState({haveRemoteStream:true})

            //video resizes window, so render stuff after
            this.refs.videoRef.addEventListener("playing",
                 ()=> { this.setState({renderControls:true}) }, true);
        }
    }

    watchStream = async () => {
        let body = {
            request: 'watch',
            id: parseInt(this.streamId)
        }
        console.log('body', body)
        var response = await this.janusController.sendMessage(this.streamingPlugin, body)
        console.log(response)
    }

    handleChange = (event) => {
        this.setState({name: event.target.value});
    }

    handleSubmit = (event) => {
        event.preventDefault();

        if(!this.state.name) {
            alert("what's your name?");
            return
        }

        this.name = this.state.name
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
                                    <Form.Control readOnly = {this.state.haveName ? true : false} type="text" placeholder={this.name} onChange={this.handleChange}/>
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
                        <h3>whoops! can't connect</h3>
                        }
                    </Col>
                </Row>
                <Row className={(this.state.haveName ? 'p-2' : 'd-none')}>
                    <Col>
                        {this.state.renderControls && 
                        <StreamController name={this.name} rover={this.rover} debug={this.props.debug}/>
                        }
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default StreamView;