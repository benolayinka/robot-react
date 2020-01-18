import React, { useLayoutEffect, useState } from 'react'
import ReactJanusController from '../Janus/ReactJanusController';
import StreamController from './StreamController.js'
import StreamCard from './StreamCard'
import {Container} from 'react-bootstrap'

class StreamView extends React.Component{
    constructor(props) {
        super(props);

        //if we're rendering debug, fix some values
        if(props.debug) {
            console.log('debugging!')
            this.user = 'ben'
            this.rover = 'debug'
        }
        else{
            console.log('not debugging!')
            this.streamId = props.match.params.id
            this.janusController = null;
            this.server = window.server
            this.streamingPlugin = 'janus.plugin.streaming'
            this.streamingPluginHandle = null
            this.user = 'ben'
            this.rover = 'mars'

            this.state = {
                stream: null,
                gotRemoteStream: false,
                width: null,
                renderControls: false,
            };
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
        } else {
            this.setState({stream: window.URL.createObjectURL(stream)})
            this.setState({gotRemoteStream:true})

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

    render() {
        //stream must be muted to autoplay
        return (
            <div className='StreamView' ref='container'>
                {this.props.debug ?
                    <div>
                        <StreamController user={this.user} rover={'debug'} renderControls={true}/>
                    </div>
                    :
                    <div>
                        <StreamCard></StreamCard>
                        <Container>
                            <video src={this.state.stream} className = 'center' ref='videoRef' width="100%" id="stream" muted autoPlay playsInline/>
                            <StreamController user={this.user} rover={this.rover} renderControls={this.state.renderControls}/>
                        </Container>
                    </div>
                }
            </div>
        );
    }
}

export default StreamView;