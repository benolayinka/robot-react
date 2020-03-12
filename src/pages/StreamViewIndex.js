import React from 'react'
import ReactJanusController from '../components/ReactJanusController';
import StreamItem from '../components/StreamItem'

class StreamViewIndex extends React.Component{

    constructor(props) {
        super(props);
        this.janusController = null
        this.server = window.server
        console.log(this.server)
        this.streamingPlugin = 'janus.plugin.streaming'

        this.state = {
            streamsList: [],
            redirectToId: null,
        };
      }

    async componentDidMount() {
        console.log('viewindex mounted')
        var janusController = new ReactJanusController();
        this.janusController = janusController
        await this.janusController.init(this.server)
        await this.janusController.attachPlugin(this.streamingPlugin)
        this.getStreams()
        this.janusController.attachCallback(this.streamingPlugin, 'onmessage', this.onMessageCallback)
    }

    onMessageCallback = (msg, jsep)=> {
        console.log(msg)
    }

    getStreams = async () => {
        var response = await this.janusController.sendMessage(this.streamingPlugin, { "request": "list" })
        this.setState({streamsList: response.list})
    }

    handleStreamClick = (streamId)=> {
        if(!window.confirm('Watch stream ' + streamId + '?')) return;
        this.setState({ redirectToId: streamId });
        this.props.history.push('/view/' + streamId)
    }

    render() {
        var StreamsList = this.state.streamsList.map((stream, index) => {
            return <li value={stream.id} key={stream.id}>
                        <div onClick={()=>this.handleStreamClick(stream.id)}>
                            <StreamItem format='false' json={stream}/>
                        </div>
                    </li>
        })

        const match = this.props.match;

        return (<div>
                    <ol>
                        {StreamsList}
                    </ol>
                </div>

                
        );
    }
}

export default StreamViewIndex;