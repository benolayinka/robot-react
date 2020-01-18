import React, { useRef, useLayoutEffect, useState } from "react";
import ReactNipple from 'react-nipple'
import {Container, Button} from 'react-bootstrap'

export default function StreamCard(props) {
    return (
        <div className='StreamCard'>
            <Container className='p-3'>
                <div id="intro">
                    <h1>sharing is caring</h1>
                    <p>hi! i'm <strong style={{color: 'HotPink'}}>diana!</strong> i'm a robot you can drive 👾
                    </p>
                    <p>when i get bigger, i'm gonna clean plastic off the beach 🏖
                    </p>
                    <p>i'm a little robot but i have big dreams!
                    </p>
                    <p>what's your name?
                    </p>
                </div>
                <div id="name-form">
					<input type="text" id="user"/>
					<Button class="btn btn-default" autocomplete="off" id="start">start</Button>
				</div>
            </Container>
        </div>
    )
}