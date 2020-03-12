/** @jsx jsx */
import React from 'react'
import {css, jsx} from '@emotion/core'

export default function Box(props) {
    return(
        <div
        css={{
            position: 'absolute',
            left: props.left,
            top: props.top,
            height: props.height,
            width: props.width || props.height,
            backgroundColor: props.backgroundColor,
            borderRadius: props.borderRadius,
            }}
        />
    )
}

Box.defaultProps = {
    left: 0,
    top: 0,
    height: 10,
    backgroundColor: 'transparent',
    borderRadius: 25,
}