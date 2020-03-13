import React from "react";
import Lottie from "react-lottie";
import Colors from '../styles/Colors.scss'
import {Container, Row, Col} from 'react-bootstrap'
import './Hello.scss'
import {CSSTransition} from 'react-transition-group'
import {
  Link,
} from "react-router-dom";

export default class Hello extends React.Component{
    constructor(props){
        super(props)

        this.state = {
            transition: 0,
        }
    }

    render(){
        return(
            <div style={{backgroundColor: Colors.pink}} className = 'overflow-hidden position-absolute h-100 w-100'>
                <Container className = 'threeD h-100 p-3'>
                    <div className='animation-container text-center d-flex h-100 flex-column align-items-center justify-content-between'>
                        <div className="bounce-in-left skew order-2 p-2">
                            <h1>welcome to good robot!</h1>
                        </div>
                        <div className="bounce-in-left skew order-1 p-2">
                            <Link to="/sim"><h1>learn the story!</h1><p>(under construction)</p></Link>
                        </div>
                        <div className="bounce-in-left skew order-3 p-2">
                            <Link to="/view/1"><h1>drive a robot!</h1></Link>
                        </div>
                    </div>
                </Container>

                {/*<Container className = 'threeD h-100 p-3'>
                    <Row >
                        hi
                    </Row>
                    <Row >
                        bye
                    </Row>
                    <Row >
                        hello
                    </Row>
                </Container>*/}
            </div>
        )
    }
}