import React, { useState } from "react";
import ReactNipple from 'react-nipple'
import {Row, Col} from 'react-bootstrap'

//gamepad, two joysticks and a button pad.
//props are leftStick, rightStick, onMove 
//joystick data is -90 to 90 x y

function StreamGamepad(props) {

    const onEventLeft = (evt, data) => {
        props.onEventLeft(evt, data)
    }

    const onEventRight = (evt, data) => {
        props.onEventRight(evt, data)
    }

    const getUsefulJoystickData = (data) => {
        let size = data.instance.options.size
        let centerX = data.instance.position.x
        let centerY = data.instance.position.y

        //scale both axes to plus minus 90 degrees
        let normalX = Math.trunc( 180 * (data.position.x - centerX) / size)
        //y axis is flipped, up is negative
        let normalY = Math.trunc (-180 * (data.position.y - centerY) / size)
        return {x:normalX, y:normalY}
    }

    const options = {
        mode: 'dynamic',
        size: props.nippleSize,
        color: props.nippleColor,
        position: { top: '50%', left: '50%' },
        fadeTime: 0,
    }

    const divStyle = {
        textAlign: 'center',
        outline: '2px dashed hotpink',
        position: 'relative',
        MozUserSelect:'none', /* Old versions of Firefox */
        WebkitUserSelect:'none', /* Safari */
        msUserSelect:'none', /* Internet Explorer/Edge */
        WebkitTouchCallout:'none', /* iOS Safari */
        userSelect:'none',
    }

    return (
        <div className='StreamGamepad'>
            <Row className='justify-content-center'>
                <Col xs={6}>
                    {props.leftJoystick && 
                    <ReactNipple
                        options={options}

                        //options={{ mode: 'static', position: { top: '50%', left: '50%' } }}
                        className='LeftJoystick'

                        //'style' passed to container element
                        style={divStyle}
                        onEnd={onEventLeft}
                        onMove={onEventLeft}
                    >
                    ↑
                    <br />← move me! →
                    <br />🚕
                    <br />↓
                    </ReactNipple>
                    }
                </Col>
                <Col xs={6}>
                    {props.rightJoystick && 
                    <ReactNipple
                        options={options}
                        
                        className='RightJoystick'

                        //'style' passed to container element
                        style={divStyle}
                        
                        onEnd={onEventRight}
                        onMove={onEventRight}
                    >
                    ↑
                    <br />← move me! →
                    <br />👀
                    <br />↓
                    </ReactNipple>
                    }
                </Col>
            </Row>
        </div>
    )
}

StreamGamepad.prototype.getUsefulJoystickData = (evt, data) => {
    if(evt.type === 'move'){
        let size = data.instance.options.size
        let centerX = data.instance.position.x
        let centerY = data.instance.position.y

        //scale both axes to plus minus 90 degrees
        let normalX = Math.trunc( 180 * (data.position.x - centerX) / size)
        //y axis is flipped, up is negative
        let normalY = Math.trunc (-180 * (data.position.y - centerY) / size)
        return {x:normalX, y:normalY}

    } else if (evt.type === 'end') {

        return {x:0, y:0}

    }
}

StreamGamepad.defaultProps = {
    nippleSize: 150,
    nippleColor: 'black'
}

export default StreamGamepad