import React, {useRef, useState, useEffect} from 'react'
import {TimelineLite, TweenMax} from 'gsap'
import {SwitchTransition, CSSTransition} from 'react-transition-group'

const defaultStyle = {
    transition: 'all 200ms ease-in-out',
    opacity: 0,
}

const transitionStyles = {
    entering: {opacity: 0, transform: 'translateY(10vh)'},
    entered: {opacity: 1, transform: 'translateY(0)'},
    exiting: {opacity: 1, transform: 'translateY(0)'},
    exited: {opacity: 0, transform: 'translateY(-10vh)'},
}

export const Slide = ({count, children}) => {
    return(
            <SwitchTransition mode="out-in">
                <CSSTransition
                    key={count}
                    timeout={200}
                    mountOnEnter
                    unmountOnExit
                >
                    {state =>
                    <div
                    style={
                        {
                            ...defaultStyle,
                            ...transitionStyles[state]
                        }
                    }
                    >
                        {children}
                    </div>
                    }
                </CSSTransition>
            </SwitchTransition>
    )
}