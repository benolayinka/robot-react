import React, {Fragment} from "react";
import Lottie from "react-lottie";
import Colors from '../styles/Colors.scss'
import {TimelineLite} from 'gsap'
import {Form, Button, Container, Row, Col, Jumbotron} from 'react-bootstrap'
import {Transition, TransitionGroup, CSSTransition} from 'react-transition-group'
import './KidsIntro.scss'
import {Slide} from './Slide'

function Dots(props){
    const active = props.progress - 1
    return (
        [...Array(props.qty)].map((e, i) => <span className={i === active ? "dot filled" : "dot"} key={i}></span>)
    )
}

class KidsIntro extends React.Component {
    constructor(props) {
        super(props);

        const intro = (
            <Container fluid className="position-absolute vh-100 t-0 l-0">
                <Row className="intropage">
                    <Col className="text-center">
                        <img src="/images/Indicator1.svg" className="indicator w-100" />
                        <h3 className="head-title">Welcome to:</h3> 
                        <h1 className="">Kids Christmas <br /> Drive-in 🎄</h1>
                        <p className="lead">
                            <button className="btn-naked" onClick={this.onClick}>click to continue</button>
                        </p>
                    </Col>
                </Row>
            </Container>
        )

        const robot = (
            <Container fluid className="position-absolute vh-100 t-0 l-0">
                <Row className="intropage">
                    <Col className="text-center">
                        <img src="/images/Indicator2.svg" className="indicator w-100" />
                        <h1 className="">You're about to drive <br /> a real robot! 🤖</h1>
                        <p className="lead text-muted">
                            <button className="btn-naked" onClick={this.onClick}>click to continue</button>
                        </p>
                    </Col>
                </Row>
            </Container>
        )

        const name = (
            <Container fluid className="position-absolute vh-100 t-0 l-0">
                <Row className="intropage">
                    <Col className="text-center">
                        <img src="/images/Indicator3.svg" className="indicator w-100" />
                        <h3 className="head-title">What's your name?</h3> 
                        <Form autoComplete="off" onSubmit={this.onSubmit}>
                            <Form.Group>
                                <Form.Control name='name' type="text" className="name" placeholder="type here.."/>
                                <button className='btn-naked' type="submit">
                                    start
                                </button>
                            </Form.Group>
                        </Form>
                    </Col>
                </Row>
            </Container>
        )

        this.pages = [intro, robot, name]

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
                    <div
                    className="loader overflow-hidden position-absolute h-100 w-100"
                    style={{
                        zIndex: this.props.zIndex,
                        ...defaultStyle,
                        ...transitionStyles[state]
                    }}
                    >
                        <img src="/images/Logo-Kids.svg" className="logo" />
                        <a href="#" className="robotinfo">Read more about the robot</a>
                        <p className="tagline">Ho, ho, ho, drive by the office.</p>
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