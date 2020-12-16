import React from "react";
import Colors from '../styles/Colors.scss'
import './Intro.scss'
import {Container, Row, Col, Image} from 'react-bootstrap'

export default class Intro extends React.Component{
    constructor(props){
        super(props)
    }

    render(){
        return(
            <div className ="intro text-center vh-100 bg-plastic">
                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">
                    <header className="masthead mb-auto sticky">
                        <div className="inner">
                        <h3 className="masthead-brand threeD-shadow">good robot</h3>
                        </div>
                        <div className="inner">
                        <h3 className="nav-masthead threeD-shadow">let's clean up the world</h3>
                        </div>
                    </header>
                    <header className="masthead mb-auto">
                    </header>

                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <h1 className="cover-heading threeD-shadow skew">The world has a plastic problem 🌎 🗑</h1>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>

                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">
                    <header className="masthead mb-auto">
                        <div className="inner">
                        <h3 className="masthead-brand"></h3>
                        </div>
                    </header>

                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <iframe src="https://player.vimeo.com/video/434339559" width="640" height="360" frameBorder="0" allow="autoplay; fullscreen" allowFullScreen></iframe>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>

                {null && 
                <>
                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">
                    <header className="masthead mb-auto">
                        <div className="inner">
                        <h3 className="masthead-brand"></h3>
                        </div>
                    </header>

                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <h1 className="cover-heading threeD-shadow skew">Humans litter 32 million tons of plastic waste per year.</h1>
                                    <p className="lead threeD-shadow skew">That's the weight of 4.8 million hippos, directly on the ground and in the water.</p>
                                </Col>
                                <Col>
                                    <Image fluid src="assets/hippo.png"/>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>

                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">

                    <header className="masthead mb-auto">
                        <div className="inner">
                        <h3 className="masthead-brand"></h3>
                        </div>
                    </header>

                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <h1 className="cover-heading threeD-shadow skew">90% of that littering occurs in developing countries.</h1>
                                    <p className="lead threeD-shadow skew">Probably far away from you...</p>
                                </Col>
                                <Col>
                                    <Image fluid src="assets/africa.png"/>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>

                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">

                    <header className="masthead mb-auto">
                        <div className="inner">
                        <h3 className="masthead-brand"></h3>
                        </div>
                    </header>

                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <h1 className="cover-heading threeD-shadow skew">Probably too far away too affect you...</h1>
                                    <p className="lead threeD-shadow skew">What can you do, right?</p>
                                </Col>
                                <Col>
                                    <Image fluid src="assets/thailand.png"/>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>
                
                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">

                    <header className="masthead mb-auto">
                        <div className="inner">
                        <h3 className="masthead-brand"></h3>
                        </div>
                    </header>

                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <h1 className="cover-heading threeD-shadow skew">But what if you could actually do something about it?</h1>
                                    <h1 className="cover-heading threeD-shadow skew">Right now?</h1>
                                    <h1 className="cover-heading threeD-shadow skew">From your phone?</h1>
                                </Col>
                                <Col>
                                    <Image fluid src="assets/phone.png"/>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>

                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">

                    <header className="masthead mb-auto">
                        <div className="inner">
                        <h3 className="masthead-brand"></h3>
                        </div>
                    </header>

                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <h1 className="cover-heading threeD-shadow skew">good robot is a plastic collecting robot powered by you.</h1>
                                </Col>
                                <Col>
                                    <Image fluid src="assets/truck.png"/>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>

                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">

                    <header className="masthead mb-auto">
                        <div className="inner">
                        <h3 className="masthead-brand"></h3>
                        </div>
                    </header>
                    
                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <h1 className="cover-heading threeD-shadow skew">Connect and drive from anywhere in the world.</h1>
                                    <p className="lead threeD-shadow skew"></p>
                                </Col>
                                <Col>
                                    <Image fluid src="assets/play.png"/>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>

                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">

                    <header className="masthead mb-auto">
                        <div className="inner">
                        <h3 className="masthead-brand"></h3>
                        </div>
                    </header>
                    
                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <h1 className="cover-heading threeD-shadow skew">Donate two minutes to identify and collect plastic.</h1>
                                    <p className="lead threeD-shadow skew"></p>
                                </Col>
                                <Col>
                                    <Image fluid src="assets/magnifying.png"/>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>

                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">

                    <header className="masthead mb-auto">
                        <div className="inner">
                        <h3 className="masthead-brand"></h3>
                        </div>
                    </header>
                    
                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <h1 className="cover-heading threeD-shadow skew">We'll turn the plastic you collect into roads and robots.</h1>
                                </Col>
                                <Col>
                                    <Image fluid src="assets/road.png"/>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>
                </>
                }

                <div className="cover-container d-flex vh-100 p-3 mx-auto flex-column">

                    <header className="masthead mb-auto">
                        <div className="inner">
                        <h3 className="masthead-brand"></h3>
                        </div>
                    </header>
                    
                    <main role="main" className="inner cover">
                        <Container>
                            <Row className="d-flex justify-content-center align-items-center">
                                <Col>
                                    <h1 className="cover-heading threeD-shadow">Join us in the fight against plastic litter.</h1>
                                    <p className="lead threeD-shadow">Connect with us to learn more and to hear the full pitch.</p>
                                    <a href="mailto:ben.olayinka@gmail.com?subject=good robot" className="btn btn-lg btn-secondary threeD">Connect with us</a>
                                </Col>
                            </Row>
                        </Container>
                    </main>

                    <footer className="mastfoot mt-auto">
                        <div className="inner">
                        <p></p>
                        </div>
                    </footer>
                </div>

            </div>
        )
    }
}