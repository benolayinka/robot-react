import React from "react";
import Lottie from "react-lottie";
import Colors from '../styles/Colors.scss'
import {TimelineLite} from 'gsap'
import {Form, Button} from 'react-bootstrap'
import {Transition} from 'react-transition-group'
import './ViewIntro.scss'
import {Slide} from './Slide'

const intro = [
            'hi, im diana!',
            'im a real robot you can drive!',
            'when i get bigger, im gonna clean trash off the beach',
            'whats your name?',
        ]

const outro = [
    'ok! get ready!'
]

class ViewIntro extends React.Component {
    constructor(props) {
        super(props);

        //these elements use a sneaky fullscreen viewport to catch clicks
        const clickerElem = (string) => {
            return (
                <>
                <h1>{string}</h1>
                <div className='clicker d-flex flex-column justify-content-end' onClick={this.onClick}>
                    <h4 className='p-4 bottom-0'>click to continue</h4>
                </div>
                </>
            )
        }

        const introElems = intro.map(clickerElem)

        const FormName = 
            <Form autoComplete="off" onSubmit={this.onSubmit}>
                <Form.Group>
                    <Form.Control name='name' type="text"/>
                    <button className='btn-naked threeD' type="submit">
                        start
                    </button>
                </Form.Group>
            </Form>

        const outroElems = outro.map(clickerElem)

        this.elems = introElems.concat([FormName]).concat(outroElems)

        this.state = {
            currentElement: this.elems[0],
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

        this.name = name

        setTimeout(() => {
            this.step()
        }, 100);
    }

    onClick = ()=>{
        this.step()
    }

    step() {
        const l = this.elems.length - 1
        if(this.state.count !== l){
            this.setState(prevState => ({
                count: prevState.count + 1,
                currentElement: this.elems[prevState.count + 1]
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
                className="ViewIntro loader"
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
                        <Slide count={this.state.count}>
                            {
                                <div className='container text-center center skew threeD'>
                                    {this.state.currentElement}
                                </div>
                            }
                        </Slide>
                    </div>
                )
                
                }
            </Transition>
        );
  }
}

ViewIntro.defaultProps = {
  zIndex: 9999,
};

export default ViewIntro