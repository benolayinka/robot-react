import * as THREE from 'three'

import CameraRenderer from './CameraRenderer'
import GamepadControls from '../scripts/GamepadControls'

const DEFAULT_FOLLOW_DIST = 45;
const FOLLOW_HEIGHT = 15;
const LOOK_HEIGHT = 8;

const CAMERA_MODES = {
  FIRST_PERSON: 'FIRST_PERSON',
  FOLLOW: 'FOLLOW',
}

class FollowCameraRenderer extends CameraRenderer {

    state = {
        camera_mode: CAMERA_MODES.FOLLOW,
    }

    constructor(props) {
        super(props)

        this.gamepadControls = new GamepadControls(this.cannonScene.controlBody, this.cannonScene.controlObject)

        this.followObject = this.gamepadControls.getLookObject()
        this.followDistance = this.followObject.followDistance || DEFAULT_FOLLOW_DIST;

        this.angularVelHistory = [];

        this.time = Date.now()

        this.lerpTarget = new THREE.Vector3()
    }

    stepFollowFixed() {
        this.followObject.updateMatrixWorld()
        const targetPosition = this.followObject.localToWorld(new THREE.Vector3(-this.followDistance, 0, FOLLOW_HEIGHT))
        this.camera.position.copy(targetPosition)

        const lookPosition = this.followObject.localToWorld(new THREE.Vector3(0, 0, LOOK_HEIGHT))

        this.camera.lookAt( lookPosition )
    }

    stepFollowSmooth() {
        this.followObject.updateMatrixWorld()
        const targetPosition = this.followObject.localToWorld(new THREE.Vector3(-this.followDistance, 0, FOLLOW_HEIGHT))
        this.camera.position.lerp(targetPosition, 0.2);

        const lookPosition = this.followObject.localToWorld(new THREE.Vector3(0, 0, LOOK_HEIGHT))
        this.camera.lookAt( lookPosition )
    }

    step() {
        switch( this.state.camera_mode ) {
            case CAMERA_MODES.FOLLOW:
                this.stepFollowSmooth();
                //this.stepFollowFixed();
                break;
                
            default:
                break;
            }
        
        this.gamepadControls.update(Date.now() - this.time, this.props.gamepadData)
        this.time = Date.now();
        super.step();
    }

    toggleFirstPersonMode() {
        if (this.state.camera_mode === CAMERA_MODES.FOLLOW) {
            this.setState({camera_mode: CAMERA_MODES.FIRST_PERSON})
            this.camera.position.set(0, 0, 0) //relative to group
            this.camera.rotation.set(Math.PI/2,-Math.PI/2,0,0)
            this.followObject.add(this.camera) //group the camera with the object
        }
        else if(this.state.camera_mode === CAMERA_MODES.FIRST_PERSON) {
            this.setState({camera_mode: CAMERA_MODES.FOLLOW})
            this.scene.add(this.camera)
        }
    }

    onClick = () => {
        this.toggleFirstPersonMode()
    }
}

export default FollowCameraRenderer