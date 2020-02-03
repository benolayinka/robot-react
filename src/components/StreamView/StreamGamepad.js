import React, { useRef, useLayoutEffect, useState } from "react";
import ReactNipple from 'react-nipple'
import {Row, Col} from 'react-bootstrap'

//gamepad, two joysticks and a button pad.
//props are leftStick, rightStick, onMove 
//joystick data is -90 to 90 x y

export default function StreamGamepad(props) {
    //size the sticks at a quarter of the screen
    //should probably redo to make this responsive
    const containerRef = useRef();
    const [dimensions, setDimensions] = useState({ width:0, height: 0 });

    // holds the timer for setTimeout and clearInterval
    let movement_timer = null;

    // the number of ms the window size must stay the same size before the
    // dimension state variable is reset
    const RESET_TIMEOUT = 100;

    const test_dimensions = () => {
        // For some reason targetRef.current.getBoundingClientRect was not available
        // I found this worked for me, but unfortunately I can't find the
        // documentation to explain this experience
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight
          });
        }
      }

      // This sets the dimensions on the first render
    useLayoutEffect(() => {
        test_dimensions();
      }, []);

    // every time the window is resized, the timer is cleared and set again
    // the net effect is the component will only reset after the window size
    // is at rest for the duration set in RESET_TIMEOUT.  This prevents rapid
    // redrawing of the component for more complex components such as charts
    // window.addEventListener('resize', ()=>{
    //     clearInterval(movement_timer);
    //     movement_timer = setTimeout(test_dimensions, RESET_TIMEOUT);
    //   });

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
        <div className='StreamGamepad' ref={containerRef}>
            {dimensions.width && 
            <Row className='justify-content-center'>
                <Col xs={6}>
                    {props.leftStick && 
                    <ReactNipple
                        options={{ mode: 'dynamic', size: 150, color: 'black', position: { top: '50%', left: '50%' } }}
                        //options={{ mode: 'static', position: { top: '50%', left: '50%' } }}
                        className='LeftJoystick'
                        // any unknown props will be passed to the container element, e.g. 'title', 'style' etc
                        style={{
                            //width: dimensions.width / 4,
                            //height: 150,
                            textAlign: 'center',
                            outline: '2px dashed hotpink',
                            position: 'relative',
                            MozUserSelect:'none', /* Old versions of Firefox */
                            WebkitUserSelect:'none', /* Safari */
                            msUserSelect:'none', /* Internet Explorer/Edge */
                            WebkitTouchCallout:'none', /* iOS Safari */
                            userSelect:'none',
                        }}
                        onMove={(evt, data) => onMove('leftJoystick', data)}
                        onEnd={(evt, data) => onEnd('leftJoystick', data)}
                    >
                    <p>drag me to drive</p>
                    <p>🚕</p>
                    </ReactNipple>
                    }
                </Col>
                <Col xs={6}>
                    {props.rightStick && 
                    <ReactNipple
                        options={{ mode: 'dynamic', size: 150, color: 'black', position: { top: '50%', left: '50%' } }}
                        className='RightJoystick'
                        // any unknown props will be passed to the container element, e.g. 'title', 'style' etc
                        style={{
                            //width: dimensions.width / 4,
                            //height: 150,
                            textAlign: 'center',
                            outline: '2px dashed hotpink',
                            position: 'relative',
                            MozUserSelect:'none', /* Old versions of Firefox */
                            WebkitUserSelect:'none', /* Safari */
                            msUserSelect:'none', /* Internet Explorer/Edge */
                            WebkitTouchCallout:'none', /* iOS Safari */
                            userSelect:'none',
                        }}
                        onMove={(evt, data) => onMove('rightJoystick', data)}
                        onEnd={(evt, data) => onEnd('rightJoystick', data)}
                    >
                    <p>drag me to look</p>
                    <p>👀</p>
                    </ReactNipple>
                    }
                </Col>
            </Row>
            }
        </div>
    )
}