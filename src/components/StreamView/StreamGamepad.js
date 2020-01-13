import React from 'react'
import ReactNipple from 'react-nipple'
import {Row} from 'simple-flexbox'

//gamepad, two joysticks and a button pad.
//props are leftStick, rightStick, onMove 
//joystick data is -90 to 90 x y

export default function StreamGamepad(props) {
    //size the sticks at a quarter of the screen
    //should probably redo to make this responsive
    
    const stickSize = props.width / 4

    const getUsefulJoystickData = (moveData) => {
        let size = moveData.instance.options.size
        let centerX = moveData.instance.position.x
        let centerY = moveData.instance.position.y

        //scale both axes to plus minus 90 degrees
        let normalX = Math.trunc( 180 * (moveData.position.x - centerX) / size)
        //y axis is flipped, up is negative
        let normalY = Math.trunc (-180 * (moveData.position.y - centerY) / size)
        return {x:normalX, y:normalY}
    }

    const onMove = (joystick, moveData) => {
        //console.log(joystick, moveData)
        let joystickData = {}
        joystickData['gamepadElementData'] = {}
        joystickData['gamepadElementData'][joystick] = getUsefulJoystickData(moveData)
        joystickData['active'] = true
        props.onMove(joystickData)
    }

    const onEnd = (joystick) => {
        //console.log(joystick)
        let joystickData = {}
        joystickData['gamepadElementData'] = {}
        joystickData['gamepadElementData'][joystick] = {x:0, y:0}
        joystickData['active'] = false
        props.onMove(joystickData)
    }

    return (
        <Row className='StreamGamepad'>
            {props.leftStick && 
            <ReactNipple
                options={{ mode: 'static', size: stickSize, color: 'black', position: { top: '50%', left: '50%' } }}
                className='LeftStick'
                // any unknown props will be passed to the container element, e.g. 'title', 'style' etc
                style={{
                    width: stickSize,
                    height: stickSize,
                    position: 'relative'
                }}
                onMove={(evt, data) => onMove('leftJoystick', data)}
                onEnd={(evt, data) => onEnd('leftJoystick', data)}
            />
            }
            {props.rightStick && <ReactNipple
                options={{ mode: 'static', size: stickSize, color: 'black', position: { top: '50%', left: '50%' } }}
                className='RightStick'
                // any unknown props will be passed to the container element, e.g. 'title', 'style' etc
                style={{
                    width: stickSize,
                    height: stickSize,
                    position: 'relative'
                }}
                onMove={(evt, data) => onMove('rightJoystick', data)}
                onEnd={(evt, data) => onEnd('rightJoystick', data)}
            />
            }
        </Row>
    )
}