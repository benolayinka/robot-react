import React, {useEffect, useState, useRef} from "react";
import ReactNipple from 'react-nipple'
import cx from 'classnames'
import './Gamepad.scss'
import {Overlay, Popover} from 'react-bootstrap'

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

    const lookRef = useRef(null)
    const driveRef = useRef(null)
    const gamepadRef = useRef(null)

    const [showLookTooltip, setShowLookTooltip] = useState(false);
    const [showDriveTooltip, setShowDriveTooltip] = useState(false);
    const [init, setInit] = useState(false)

    useEffect(() => {
        if(!init){
            //refs are empty until component mounts
            setShowLookTooltip(props.showTooltips)
            setShowDriveTooltip(false)
            setInit(true)
        }

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

        return function cleanup() {
            //remove event listeners
            // add event listeners for keyboard and mouse
            var x = document.getElementsByClassName("gamepad")
            var domElement = x[0]
            domElement.removeEventListener( 'keydown', onKeydown, false)
            domElement.removeEventListener( 'keyup', onKeyup, false)
        }

    }, [showLookTooltip, showDriveTooltip]);

    const onKeydown = ( event ) => {
        onKey(event, true)
	}

    const onKeyup = ( event ) => {
        onKey(event, false)
    }

    const onKey = (event, pressed) => {
        //event.preventDefault();
        setShowLookTooltip(false)
        setShowDriveTooltip(false)
        let evt = 'key'
        let data = {key: event.keyCode, pressed: pressed}
        handleEvent(evt, data)
    }

    const handleButton = (index, data) => {
        setShowLookTooltip(false)
        setShowDriveTooltip(false)
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
        if(showLookTooltip){
            setShowLookTooltip(false)
            setShowDriveTooltip(true)
        }
        handleJoystick('lookJoystick', event, data)
    }

    const handleDriveJoystick = (event, data) => {
        setShowLookTooltip(false)
        setShowDriveTooltip(false)
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
        <div ref={gamepadRef} className = {cx('gamepad', 'h-100', 'w-100', 'p-4', 'position-absolute', props.className)} >
            {/* inner container respects padding */}
            <div className = 'container-inner position-relative h-100 w-100'>
                {/* hidden pseudo box to position popover halfway down video */}
                <div ref={lookRef} style={{zIndex:-1}} className = 'h-25 w-100 position-absolute' />
                <ReactNipple
                    className='LookJoystick h-100 w-100'
                    options={lookNippleOptions}
                    style={{zIndex: 0}}
                    onMove={handleLookJoystick}
                    onEnd={handleLookJoystick}
                />
                <Overlay container={gamepadRef.current} target={lookRef.current} show={showLookTooltip} placement="bottom">
                    <Popover id="popover-look">
                    <Popover.Content>
                        <span className='threeD'>drag the screen to look around!</span>
                    </Popover.Content>
                    </Popover>
                </Overlay>
                <div ref={driveRef}
                    style={{
                        width: props.nippleSize / 2,
                        bottom: px((props.nippleSize / 2)),
                        left: px((props.nippleSize / 2)),
                        zIndex:-1}}
                    className = 'position-absolute' />
                <ReactNipple
                    options={options}
                    className='DriveJoystick position-absolute'
                    style={{bottom: px((props.nippleSize / 2)),
                            left: px((props.nippleSize / 2)),
                            zIndex:1,
                            }}
                    onMove={handleDriveJoystick}
                    onEnd={handleDriveJoystick}
                />
                <Overlay container={gamepadRef.current} target={driveRef.current} show={showDriveTooltip} placement="right">
                    <Popover id="popover-drive">
                    <Popover.Content>
                        <span className='threeD'>move me to drive!</span>
                    </Popover.Content>
                    </Popover>
                </Overlay>
                
            </div>
        </div>
    )
}

Gamepad.defaultProps = {
    nippleSize: 150,
    nippleColor: 'none',
    showTooltips: true,
}

export default Gamepad