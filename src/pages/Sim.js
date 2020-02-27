import React from 'react'
import Div100vh from 'react-div-100vh'
import FollowCameraRenderer from '../components/FollowCameraRenderer'
import CannonScene from '../3d/CannonScene'
import Gamepad from '../components/Gamepad'
import ScoreBoard from '../components/ScoreBoard'

export default class Sim extends React.Component{
    constructor(props) {
        super(props);
        this.gamepadData = {
            joystickData: {x:0, y:0},
            buttonsPressed: {0:false, 1:false, 2:false},
            keysPressed: {},
        }

        this.state = {
            width: null
        }

        this.cannonScene = new CannonScene(this.gamepadData)
    
    }

    componentDidMount() {
        this.setState({width:this.refs.container.clientWidth})

        //force component to remount on resize
        window.addEventListener('resize', ()=>{
            this.setState({width:null}, ()=>{
                this.setState({width:this.refs.container.clientWidth})
            })
        })
    }

	onGamepadEvent = (evt, data) => {
        if(evt === 'joystick'){
            this.gamepadData.joystickData = data
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

    render() {
        let containerStyle = {
            width:'100%',
            height:'100%',
        }

        return (
            <Div100vh className='Sim' >
                <ScoreBoard></ScoreBoard>
                <div ref='container' style={containerStyle}>
                    {this.state.width &&
                    <Gamepad onEvent={this.onGamepadEvent} nippleSize={this.state.width/6} buttonSize={this.state.width/15}>
                        <FollowCameraRenderer cannonScene={this.cannonScene}/>
                    </Gamepad>
                    }
                </div>
            </Div100vh>
        )
    }
}