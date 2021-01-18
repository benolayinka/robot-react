import React from 'react'
import Div100vh from 'react-div-100vh'
import FollowCameraRenderer from '../components/FollowCameraRenderer'
import CannonScene from '../3d/CannonScene'
import ScoreBoard from '../components/ScoreBoard'
import Loading from "../components/Loading"
import Colors from '../styles/Colors.scss'
import ReactNipple from 'react-nipple'
import {Overlay, Tooltip} from 'react-bootstrap'

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
            //placeholder
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
            <Div100vh className='Sim' >
                <div ref='container' style={containerStyle}>
                    <Loading loaded={this.state.sceneLoaded} timeout={1200}/>
                    {this.state.width &&
                    <div className = 'width' style={containerStyle}>
                        <ScoreBoard/>
                        <FollowCameraRenderer cannonScene={this.cannonScene} position={this.cannonScene.controlBody.position}/>
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
                    </div>
                    }
                </div>
            </Div100vh>
        )
    }
}