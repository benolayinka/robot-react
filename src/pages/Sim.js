import React from 'react'
import Div100vh from 'react-div-100vh'
import FollowCameraRenderer from '../components/FollowCameraRenderer'
import CannonScene from '../3d/CannonScene'
import Gamepad from '../components/Gamepad'
import ScoreBoard from '../components/ScoreBoard'
import Loading from "../components/Loading"
import Colors from '../styles/Colors.scss'

export default class Sim extends React.Component{
    constructor(props) {
        super(props);
        this.gamepadData = {
            driveJoystickData: {x:0, y:0},
            lookJoystickData: {x:0, y:0},
            buttonsPressed: {0:false, 1:false, 2:false},
            keysPressed: {},
        }

        this.state = {
            width: null,
            sceneLoaded: false
        }

        this.cannonScene = new CannonScene(this.gamepadData, this.onSceneLoaded)
    }

    onSceneLoaded = () => {
        this.setState({sceneLoaded:true})
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

    render() {
        let containerStyle = {
            width:'100%',
            height:'100%',
            position:'relative',
        }

        return (
            <Div100vh className='Sim' >
                <ScoreBoard></ScoreBoard>
                <div ref='container' style={containerStyle}>
                    <Loading loaded={this.state.sceneLoaded} timeout={1200}/>
                    {this.state.width &&
                    <div className = 'width' style={containerStyle}>
                        <FollowCameraRenderer cannonScene={this.cannonScene} position={this.cannonScene.controlBody.position}/>
                        <Gamepad onEvent={this.onGamepadEvent} nippleSize={Math.max(this.state.width/6, 100)} buttonSize={Math.max(this.state.width/15, 40)}/>
                    </div>
                    }
                </div>
            </Div100vh>
        )
    }
}