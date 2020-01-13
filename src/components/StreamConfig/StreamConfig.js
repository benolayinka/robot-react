import React from 'react'
import StreamItem from './StreamItem.jsx'
import ReactJanusController from '../Janus/ReactJanusController';
import CreateStreamForm from './CreateStreamForm.jsx';

class StreamConfig extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            //streamconfig is a page, so we give it a Janus controller
            janus: null,
            server: '/janusbase/janus',
            plugin: 'janus.plugin.streaming',
            list: [],
        };
      }

    async componentDidMount() {
        var janus = new ReactJanusController();
        //state is not updated until after function ends, have to modify directly
        this.state.janus = janus
        await this.state.janus.init(this.state.server)
        await this.state.janus.attachPlugin(this.state.plugin)
        this.getStreams()
    }

    getStreams = async () => {
        var response = await this.state.janus.sendMessage(this.state.plugin, { "request": "list" })
        this.setState({list: response.list})
    }

    updateStreamInfo = async(streamId) => {
        let streamIndex = this.state.list.findIndex((obj => obj.id == streamId));
        let updatedList = this.state.list.slice()
        let updatedStream = await this.getStreamInfo(streamId)
        updatedList[streamIndex] = updatedStream
        this.setState({list: updatedList})
    }

    getStreamInfo = async(streamId) => {
        let response = await this.state.janus.sendMessage(this.state.plugin, 
                {
                    "request" : "info",
                    "id" : streamId,
                }
            )
        return response.info
    }

    handleDestroyClick = (streamId) => {
        if(!confirm('Delete stream ' + streamId + '?')) return;
        this.destroyStream(streamId, false)
        this.getStreams()
    }

    destroyStream = async(streamId, permanent, secret='') => {
        let body = {
            "request" : "destroy",
            "id" : streamId,
            "secret" : secret,
            "permanent" : permanent //true, false
        }
        let response = await this.state.janus.sendMessage(this.state.plugin, body)
        if(response.streaming !== 'destroyed')
            alert(response.error)
    }

    handleCreateStreamClick = (formData)=> {
        if(!confirm('Create stream?')) return;
        this.createStream(formData)
    }

    createStream = async(streamData) => {
        let body = {...{"request": "create"}, ...streamData}
        let response = await this.state.janus.sendMessage(this.state.plugin, body)
        if(response.streaming !== 'created')
            alert(response.error)
    }

    render() {
        var StreamsList = this.state.list.map((stream, index) => {
            console.log({stream})
            return <li value={stream.id} key={stream.id}>
                        <span onClick={()=>this.handleDestroyClick(stream.id)}>x</span>
                        <div onClick={()=>this.updateStreamInfo(stream.id)}>
                            <StreamItem format='false' json={stream}/>
                        </div>
                    </li>
        })
        return (<div>
                    <ol >
                        {StreamsList}
                    </ol>
                    <CreateStreamForm notifySubmit={this.handleCreateStreamClick}/>
                </div>
        );
    }
}

export default StreamConfig;