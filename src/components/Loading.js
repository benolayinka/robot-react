import React from "react";
import FadeIn from "react-fade-in";
import Lottie from "react-lottie";
import ReactLoading from "react-loading";
import * as legoData from "./Legoloading.json";
import * as doneData from "./Doneloading.json";
import Colors from '../styles/Colors.scss';

class Loading extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      done: false
    };
  }

  componentDidMount() {
    this.componentDidUpdate()
  }

  componentDidUpdate() {
    if(this.props.loaded){
      setTimeout(() => {
        this.setState({ done: true });
      }, this.props.timeout);
    }
  }

  render() {

    const defaultOptions = {
      loop: true,
      autoplay: true,
      animationData: legoData.default,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice"
      }
    };

    const defaultOptions2 = {
      loop: false,
      autoplay: true,
      animationData: doneData.default,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice"
      }
    };

    const divStyle = {
      backgroundColor: Colors["bg-kids"],
      position: 'absolute',
      zIndex: this.state.done ? -1 : this.props.zIndex,
      width: '100%',
      height: '100%',
      opacity: this.state.done ? 0 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 250ms ease',
      transitionDelay: '750ms'
    }

    //todo this is ugly, clean up
    return (
      <div className='loader' style={divStyle}>
        <div>
          {this.props.failed ?
          <>
          <h1 className="">{this.props.failedElement}</h1>
          <Lottie options={defaultOptions} height={120} width={120} />
          </>
          :
          <>
            {!this.state.done ?
              <>
              <h1 className="">{this.props.loadingElement}</h1>
              <Lottie options={defaultOptions} height={120} width={120} />
              </>
              :
              <>
              <h1 className="">{this.props.doneElement}</h1>
              <Lottie options={defaultOptions2} height={120} width={120} />
              </>
            }
          </>
          }
        </div>
      </div>
    );
  }
}

Loading.defaultProps = {
  loadingElement: 'loading',
  doneElement: 'done!',
  failedElement: 'failed!',
  zIndex: 9999,
};

export default Loading;