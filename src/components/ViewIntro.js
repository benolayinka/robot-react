import React, {Fragment} from "react";
import Lottie from "react-lottie";
import Colors from '../styles/Colors.scss'
import {TimelineLite} from 'gsap'
import {Form, Button} from 'react-bootstrap'
import {Transition} from 'react-transition-group'
import './ViewIntro.scss'
import {Slide} from './Slide'

const intro = [
            '<h1>christmas drive-in 🎄</h1>',
            '<h1>you are about to drive a real robot!',
            '<h1>whats your name?</h1>',
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
                <div className="fader" dangerouslySetInnerHTML={{ __html: string }} />
                </>
            )
        }

        const introElems = intro.map(clickerElem)
        const FormName = 
            <Form autoComplete="off" onSubmit={this.onSubmit} className="clicker-form form-hack">
                <Form.Group>
                    <Form.Control name='name' type="text" className="name" placeholder="my name is.."/>
                    <button className='btn-naked' type="submit">
                        start
                    </button>
                </Form.Group>
            </Form>

        const outroElems = outro.map(clickerElem)

        this.elems = introElems.concat([FormName])

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

        this.props.onGotName(name)

        setTimeout(() => {
            this.step()
        }, 100);
    }

    onClick = ()=>{
        if(this.state.count != 3)
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
                        <div className='container d-flex flex-column weird-center text-center'>
                            {this.elems.slice(0,this.state.count+1)}
                        </div>
                        <div className='p-4 b-0 position-absolute text-center center skew threeD'>
                            <h4 className='p-4 b-0'>click to continue</h4>
                        </div>
                        <div className='clicker' onClick={this.onClick} />
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