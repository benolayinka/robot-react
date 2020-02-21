import * as THREE from 'three'
import * as CANNON from 'cannon'

const PI_2 = Math.PI / 2
const eyeYPos = 2
const velocityFactor = 0.2

export default class GamepadControls{

    constructor(cannonBody, controlObject){
        this.cannonBody = cannonBody

        this.lookObject = new THREE.Object3D()
        controlObject.add(this.lookObject)

        this.quat = new THREE.Quaternion()

        this.cannonBody = cannonBody

        this.velocity = this.cannonBody.velocity

        this.inputVelocity = new THREE.Vector3();
    }

    getLookObject() {
        return this.lookObject
    }

    getDirection(targetVec){
        targetVec.set(0,0,-1);
        this.quat.multiplyVector3(targetVec);
    }

    update(delta, gamepadData){

        delta = delta * 0.005

        var range = 90

        var moveY,moveX, lookX, lookY
        moveY = moveX = lookY = lookX = 0

        //back, or key s = 83
        if(gamepadData.buttonsPressed[0] || gamepadData.keysPressed['83'])
            moveY -= range

        //forward, button 1 or key w = 87
        if(gamepadData.buttonsPressed[1] || gamepadData.keysPressed['87'])
            moveY += range

        //right, or key d = 68
        if(gamepadData.keysPressed['68'])
            moveX += range

        //left, or key a = 65
        if(gamepadData.keysPressed['65'])
            moveX -= range

        //lookUp, i = 73
        if(gamepadData.keysPressed['73'])
            lookY += range

        //lookLeft, j=74
        if(gamepadData.keysPressed['74'])
            lookX -= range

        //lookDown, k=75
        if(gamepadData.keysPressed['75'])
            lookY -= range
        
        //lookRight l=76
        if(gamepadData.keysPressed['76'])
            lookX += range

        if(gamepadData.buttonsPressed[2]){
            //joystick is look
            lookX += gamepadData.joystickData.x
            lookY += gamepadData.joystickData.y
        } else {
            moveX += gamepadData.joystickData.x
            moveY += gamepadData.joystickData.y
        }

        this.inputVelocity.set(0,0,0)

        this.inputVelocity.x = moveY * delta * 0.2 //movement fwd back

        this.lookObject.getWorldQuaternion( this.quat )
        this.inputVelocity.applyQuaternion( this.quat )
        this.cannonBody.velocity.x += this.inputVelocity.x
        this.cannonBody.velocity.y += this.inputVelocity.y

        //apply rotation
        this.cannonBody.angularVelocity.z += -moveX * delta * 0.2 * 0.05

        //apply rotation to look object (relative to body)
        this.lookObject.rotation.y = -lookY * 0.010;
        this.lookObject.rotation.z = -lookX * 0.010;

        // //button 2 is look
        // if(gamepadData.buttonsPressed[2]){
        //     //joystick is look
        //     var lookX = gamepadData.joystickData.x
        //     var lookY = gamepadData.joystickData.y
        //     this.lookObject.rotation.y = -lookY * 0.010;
        //     this.lookObject.rotation.z = -lookX * 0.010;
        // } else {
        //     //joystick is move
        //     var moveX = gamepadData.joystickData.x
        //     var moveY = gamepadData.joystickData.y

        //     var delta = 0.1
        //     this.inputVelocity.set(0,0,0)

        //     this.inputVelocity.x = moveY * delta * 0.2 //movement fwd back

        //     this.lookObject.getWorldQuaternion( this.quat )
        //     this.inputVelocity.applyQuaternion( this.quat )
        //     this.cannonBody.velocity.x += this.inputVelocity.x
        //     this.cannonBody.velocity.y += this.inputVelocity.y

        //     //apply rotation
        //     this.cannonBody.angularVelocity.z += -moveX * delta * 0.2 * 0.05
        // }
    }
}