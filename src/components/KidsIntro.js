import React, {Fragment} from "react";
import Lottie from "react-lottie";
import Colors from '../styles/Colors.scss'
import {TimelineLite} from 'gsap'
import {Form, Button, Container, Row, Col, Image} from 'react-bootstrap'
import {Transition, TransitionGroup, CSSTransition} from 'react-transition-group'
import './KidsIntro.scss'
import {Slide} from './Slide'
import Div100vh from 'react-div-100vh'
import Snowfall from 'react-snowfall'

function Dots(props){
    const active = props.progress - 1
    return (
        [...Array(props.qty)].map((e, i) => <span className={i === active ? "dot filled" : "dot"} key={i}></span>)
    )
}

class KidsIntro extends React.Component {
    constructor(props) {
        super(props);

        this.snowRef = React.createRef();

        const goodbye = (
            <div className="position-absolute w-100 h-100 t-0 l-0 d-flex align-items-center">
                <Container>
                    <Row className="d-flex align-items-center h-100">
                        <Col className="text-center">
                            <h3 className="head-title">That's all, folks! 🎅</h3> 
                            <h1 className="font-family-clearface">Thanks for driving</h1>
                            <h1 className="font-family-clearface">Happy holidays and see you soon</h1>
                            <h3> 🤖 🎄 </h3>
                            <Image className="w-25" src="/images/christmas.jpg" />
                        </Col>
                    </Row>
                </Container>
            </div>
        )

        const preload = (
            <div className="position-absolute w-100 h-100 t-0 l-0 d-flex align-items-center">
                <Container>
                    <Row className="d-flex align-items-center h-100">
                        <Col className="text-center">
                            <img src="/images/Indicator1.svg" className="indicator w-100" />
                            <h3 className="head-title">Ho, ho, ho! 🎅🎄</h3> 
                            <h1 className="title">Our drive in opens at 13:00 Berlin time 🚗</h1>
                            <p className="lead">
                                See you there!
                            </p>
                        </Col>
                    </Row>
                </Container>
            </div>
        )

        const intro = (
            <div className="position-absolute w-100 h-100 t-0 l-0 d-flex align-items-center">
                <Container>
                    <Row className="d-flex align-items-center h-100">
                        <Col className="text-center">
                            <img src="/images/Indicator1.svg" className="indicator w-100" />
                            <h3 className="head-title">Welcome to:</h3> 
                            <h1 className="title">Ben's Xmas Robot Drive in! 🎄</h1>
                            <p className="lead">
                                <button className="btn-naked kids-link" onClick={this.onClick}>click to continue</button>
                            </p>
                        </Col>
                    </Row>
                </Container>
            </div>
        )

        const robot = (
            <div className="position-absolute h-100 w-100 t-0 l-0 d-flex align-items-center">
                <Container>
                    <Row className="d-flex align-items-center h-100">
                        <Col className="text-center">
                            <img src="/images/Indicator2.svg" className="indicator w-100" />
                            <h1 className="title">You're about to drive a real robot! 🤖</h1>
                            <p className="lead text-muted">
                                <button className="btn-naked kids-link" onClick={this.onClick}>click to continue</button>
                            </p>
                        </Col>
                    </Row>
                </Container>
            </div>
        )

        const name = (
            <div className="position-absolute h-100 w-100 t-0 l-0 d-flex align-items-center">
                <Container>
                    <Row className="d-flex align-items-center h-100">
                        <Col className="text-center">
                            <img src="/images/Indicator3.svg" className="indicator w-100" />
                            <h3 className="head-title">What's your name?</h3> 
                            <Form autoComplete="off" onSubmit={this.onSubmit}>
                                <Form.Group>
                                    <Form.Control name='name' type="text" className="name" placeholder="Type here..."/>
                                    <button className='btn-naked kids-link' type="submit">
                                        start
                                    </button>
                                </Form.Group>
                            </Form>
                        </Col>
                    </Row>
                </Container>
            </div>
        )

        this.pages = [goodbye, intro, robot, name]

        this.state = {
            currentPage: this.pages[0],
            done: false,
            haveName: false,
            count: 0,
        };

    }

    onSubmit = (event) => {
        event.preventDefault();

        let form = event.target
        let name = form.elements.name.value

        if(!name || name === '') {
            alert("what's your name?");
            return
        }

        this.props.onGotName(name)

        setTimeout(() => {
            this.step()
        }, 100);
    }

    onClick = (e)=>{
        console.log(e)
        this.step()
    }

    step() {
        const l = this.pages.length - 1
        if(this.state.count !== l){
            this.setState(prevState => ({
                count: prevState.count + 1,
                currentPage: this.pages[prevState.count + 1]
            }))
        } else {
            this.setState({done:true})
        }
    }

    render() {

        const defaultStyle = {
        transition: `all 200ms ease-in-out`,
        opacity: 0,
        }

        const transitionStyles = {
        entering: { opacity: 1 },
        entered:  { opacity: 1 },
        exiting:  { opacity: 0 },
        exited:  { opacity: 0 },
        };

        return (
            <Transition
                in={!this.state.done}
                timeout={200}
                className="KidsIntro loader"
                mountOnEnter
                unmountOnExit
            >
                {state => (
                    <Div100vh>
                    <div
                    ref={this.snowRef}
                    className="loader overflow-hidden position-absolute h-100 w-100"
                    style={{
                        zIndex: this.props.zIndex,
                        ...defaultStyle,
                        ...transitionStyles[state]
                    }}
                    >   
                        <Snowfall />
                        <img src="/images/egghead.png" className="logo" />
                        <p className="tagline">Merry xmas from Diana the robot! 🎅🎄</p>
                        <TransitionGroup>
                            <CSSTransition
                            classNames="slide"                                    
                            timeout={{ enter: 250, exit: 250 }}                                 
                            key={this.state.count}
                            >
                            {this.state.currentPage}
                            </CSSTransition>                              
                        </TransitionGroup>
                    </div>
                    </Div100vh>
                )
                
                }
            </Transition>
        );
  }
}

KidsIntro.defaultProps = {
  zIndex: 9999,
};

export default KidsIntro