import React, {useEffect, useState} from "react";
import ReactNipple from 'react-nipple'
import {Row, Col, Button} from 'react-bootstrap'

function px(int){
    return int.toString() + 'px'
}

const bottomPadding = 5

function GamepadButton(props) {

    const [pressed, setPressed] = useState(false);

    const rightPadding = 0

    const margin = 1.2

    const buttonOuterHeight = props.buttonSize*margin
    const buttonOuterWidth = props.buttonSize*margin + bottomPadding

    const buttonInnerHeight = props.buttonSize
    const buttonInnerWidth = buttonInnerHeight

    const buttonOuterDivStyle = (indexFromBottom) => { 
        return {
            opacity: pressed ? 1 : 0.5,
            position: 'absolute',
            height: px(buttonOuterHeight),
            width: px(buttonOuterWidth),
            bottom: px(bottomPadding + buttonOuterHeight * indexFromBottom),
            right: px(rightPadding),
            textAlign: 'center',
            color: 'white',
            MozUserSelect:'none', /* Old versions of Firefox */
            WebkitUserSelect:'none', /* Safari */
            msUserSelect:'none', /* Internet Explorer/Edge */
            WebkitTouchCallout:'none', /* iOS Safari */
            userSelect:'none',
        }
    }

    const buttonInnerDivStyle = {
        border: '2px dashed white',
        borderRadius: '10px',
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
        <div onTouchStart={onTouchStart} onMouseDown={onTouchStart} onTouchEnd={onTouchEnd} onMouseUp={onTouchEnd} style = {buttonOuterDivStyle(props.indexFromBottom)}>
            <div style = {buttonInnerDivStyle}>
                {props.children}
            </div>
        </div>
    )
}

function Gamepad(props) {

    let nippleSize, buttonSize

    nippleSize = props.nippleSize < 100 ? 100 : props.nippleSize
    buttonSize = props.buttonSize < 40 ? 40 : props.buttonSize

    useEffect(() => {
        // hack the nipple elements to add a border to circles
        var x = document.getElementsByClassName("front");
        var i;
        for (i = 0; i < x.length; i++) {
            x[i].style.border = "2px dashed white"
            x[i].style.opacity = "1"
        }

        var x = document.getElementsByClassName("back");
        var i;
        for (i = 0; i < x.length; i++) {
            x[i].style.border = "2px dashed white"
            x[i].style.opacity = "0.5"
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
    });

    const options = {
        mode: 'static',
        restOpacity: 1,
        size: nippleSize,
        color: props.nippleColor,
        position: { top: '50%', left: '50%' },
        fadeTime: 0,
    }

    const nippleDivStyle = {
        position: 'absolute',
        bottom: px((nippleSize / 2) + bottomPadding),
        left: px((nippleSize / 2) + bottomPadding),
        MozUserSelect:'none', /* Old versions of Firefox */
        WebkitUserSelect:'none', /* Safari */
        msUserSelect:'none', /* Internet Explorer/Edge */
        WebkitTouchCallout:'none', /* iOS Safari */
        userSelect:'none',
        zIndex:10,
    }

    const gamepadDivStyle = {
        outline: 'none', //otherwise selected domelement is highlighted
        position: 'absolute',
        width:'100%',
        height:'100%',
        MozUserSelect:'none', /* Old versions of Firefox */
        WebkitUserSelect:'none', /* Safari */
        msUserSelect:'none', /* Internet Explorer/Edge */
        WebkitTouchCallout:'none', /* iOS Safari */
        userSelect:'none',
    }

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

    const handleJoystick = (event, data) => {
        let evt = 'joystick'
        let dat = getUsefulJoystickData(event, data)
        handleEvent(evt, dat)
    }

    const handleEvent = (event, data) => {
        props.onEvent(event, data)
    }

    return (
        <div className = 'gamepad' style = {gamepadDivStyle}>
            {props.children}
            <ReactNipple
                options={options}

                //options={{ mode: 'static', position: { top: '50%', left: '50%' } }}
                className='LeftJoystick'

                //'style' passed to container element
                style={nippleDivStyle}

                onMove={handleJoystick}
                onEnd={handleJoystick}
            >
            &nbsp;
            </ReactNipple>
            <GamepadButton onEvent={handleButton} buttonSize={buttonSize} indexFromBottom={2}>
                👀
            </GamepadButton>
            <GamepadButton onEvent={handleButton} buttonSize={buttonSize} indexFromBottom={1}>
                ▲
            </GamepadButton>
            <GamepadButton onEvent={handleButton} buttonSize={buttonSize} indexFromBottom={0}>
                ▼
            </GamepadButton>
        </div>
    )
}

Gamepad.defaultProps = {
    nippleSize: 150,
    nippleColor: 'none'
}

export default Gamepad