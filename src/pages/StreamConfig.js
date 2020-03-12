import React from 'react'
import StreamItem from '../components/StreamItem.jsx'
import ReactJanusController from '../components/ReactJanusController';
import CreateStreamForm from '../components/CreateStreamForm.jsx';
import {Modal, Form, Button, ListGroup} from 'react-bootstrap'

class StreamConfig extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            //streamconfig is a page, so we give it a Janus controller
            janus: null,
            server: '/janusbase/janus',
            plugin: 'janus.plugin.streaming',
            list: [],
            deleteStreamId: null,
            showDeleteModal:false,
            deleteModalHeading:null,
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
        let streamIndex = this.state.list.findIndex((obj => obj.id === streamId));
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

    handleDeleteModal = (event) => {
         // upon submit, prevent whole page from refreshing
        event.preventDefault()
        let form = event.target
        let permanent = form.elements.permanent.checked
        let secret = form.elements.secret.value
        let streamId = this.state.deleteStreamId
        this.setState({showDeleteModal:false})
        console.log('delete', form.elements)
        this.destroyStream(streamId, permanent, secret)
        this.getStreams()
    }

    handleDestroyClick = (streamId) => {
        this.setState({
            deleteStreamId: streamId,
            deleteModalHeading: 'Delete stream ' + streamId + '?',
            showDeleteModal:true,
            })
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
        if(!window.confirm('Create stream?')) return;
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
                    <Modal show={this.state.showDeleteModal}>
                        <Form autoComplete="off" onSubmit={this.handleDeleteModal}>
                        <Modal.Header closeButton>
                        <Modal.Title>{this.state.deleteModalHeading}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group controlId="formPermanent">
                                <Form.Check type="checkbox" name='permanent' label="permanent" />
                            </Form.Group>
                            <Form.Group controlId="formSecret">
                                <Form.Control type="text" name='secret' placeholder="secret" />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                        <Button variant="secondary" onClick={()=>{this.setState({showDeleteModal:false})}}>
                            cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            delete stream
                        </Button>
                        </Modal.Footer>
                        </Form>
                    </Modal>
                </div>
        );
    }
}

export default StreamConfig;