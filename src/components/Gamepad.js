import React, {useEffect, useState} from "react";
import ReactNipple from 'react-nipple'
import cx from 'classnames'
import './Gamepad.scss'

function px(int){
    return int.toString() + 'px'
}

function GamepadButton(props) {

    const [pressed, setPressed] = useState(false);

    const rightPadding = 0

    const margin = 1.2

    const buttonOuterHeight = props.buttonSize*margin
    const buttonOuterWidth = props.buttonSize*margin

    const buttonInnerHeight = props.buttonSize
    const buttonInnerWidth = buttonInnerHeight

    const buttonOuterDivStyle = (indexFromBottom) => { 
        return {
            position: 'absolute',
            height: px(buttonOuterHeight),
            width: px(buttonOuterWidth),
            bottom: px(buttonOuterHeight * indexFromBottom),
            right: 0,
        }
    }

    const buttonInnerDivStyle = {
        position:'absolute',
        opacity: pressed ? 1 : 0.25,
        lineHeight: px(buttonInnerHeight),
        height: px(buttonInnerHeight),
        width: px(buttonInnerWidth),
    }

    const onTouchStart = (e) => {
        props.onEvent(props.indexFromBottom, {pressed: true})
        setPressed(true)
    }

    const onTouchEnd = (e) => {
        props.onEvent(props.indexFromBottom, {pressed: false})
        setPressed(false)
    }

    return(
        <div className='btn-outer' onTouchStart={onTouchStart} onMouseDown={onTouchStart} onTouchEnd={onTouchEnd} onMouseUp={onTouchEnd} style = {buttonOuterDivStyle(props.indexFromBottom)}>
            <div className='btn-shadow' style = {buttonInnerDivStyle}>
            </div>
            <div className = 'btn-icon'>
                {props.children}
            </div>
        </div>
    )
}

function Gamepad(props) {

    useEffect(() => {
        // add event listeners for keyboard and mouse
        var x = document.getElementsByClassName("gamepad")
        var domElement = x[0]

        //allow element to be focused
        if ( domElement ) domElement.setAttribute( 'tabindex', - 1 )
        domElement = ( domElement !== undefined ) ? domElement : document;
        domElement.focus()
        domElement.addEventListener( 'keydown', onKeydown, false)
        domElement.addEventListener( 'keyup', onKeyup, false)
        //document.addEventListener( 'mousemove', onMouseMove, false );
        //document.addEventListener( 'keydown', onKeyDown, false );
        //document.addEventListener( 'keyup', onKeyUp, false ) 
    });

    const onKeydown = ( event ) => {
        onKey(event, true)
	}

    const onKeyup = ( event ) => {
        onKey(event, false)
    }

    const onKey = (event, pressed) => {
        //event.preventDefault();
        let evt = 'key'
        let data = {key: event.keyCode, pressed: pressed}
        handleEvent(evt, data)
    }

    const handleButton = (index, data) => {
        let event = 'button'
        let dat = {button: index, pressed: data.pressed}
        handleEvent(event, dat)
    }

    const getUsefulJoystickData = (evt, data) => {
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

    const handleLookJoystick = (event, data) => {
        handleJoystick('lookJoystick', event, data)
    }

    const handleDriveJoystick = (event, data) => {
        handleJoystick('driveJoystick', event, data)
    }

    const handleJoystick = (joystick, event, data) => {
        let evt = joystick
        let dat = getUsefulJoystickData(event, data)
        handleEvent(evt, dat)
    }

    const handleEvent = (event, data) => {
        props.onEvent && props.onEvent(event, data)
    }

    const options = {
        mode: 'static',
        restOpacity: 1,
        size: props.nippleSize,
        color: props.nippleColor,
        position: { top: '50%', left: '50%' },
        fadeTime: 0,
    }

    const lookNippleOptions = {
        mode: 'dynamic',
        size: props.nippleSize,
        color: props.nippleColor,
        fadeTime: 0,
    }

    return (
        <div className = {cx('gamepad', 'h-100', 'w-100', 'p-4', 'position-absolute', props.className)} >
            {/* inner container respects padding */}
            <div className = 'container-inner position-relative h-100 w-100'>
            <ReactNipple
                className='LookJoystick h-100 w-100'
                options={lookNippleOptions}
                style={{zIndex: 0}}
                onMove={handleLookJoystick}
                onEnd={handleLookJoystick}
            />
            <ReactNipple
                options={options}
                className='DriveJoystick position-absolute'
                style={{bottom: px((props.nippleSize / 2)),
                        left: px((props.nippleSize / 2)),
                        zIndex:10,
                        }}
                onMove={handleDriveJoystick}
                onEnd={handleDriveJoystick}
            />
            <GamepadButton onEvent={handleButton} buttonSize={props.buttonSize} indexFromBottom={1}>
                ▲
            </GamepadButton>
            <GamepadButton onEvent={handleButton} buttonSize={props.buttonSize} indexFromBottom={0}>
                ▼
            </GamepadButton>
            </div>
        </div>
    )
}

Gamepad.defaultProps = {
    nippleSize: 150,
    nippleColor: 'none'
}

export default Gamepad