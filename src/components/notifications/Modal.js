import React,{useState,useRef,useEffect} from 'react';

import './Modals.css'


const Modal = ()=>{
  const node = useRef(null);
  const [state,setState] = useState(true)
  const handleClick =(e)=>{
    if(node.current.contains(e.target)){
      return;
    }
    setState(false)
  }

  useEffect(()=>{
    document.addEventListener("mousedown",handleClick)

    return()=>{
      document.removeEventListener("mousedown",handleClick)
    }
  },[])

  return(
      <div className={state?"modal":' modal out'} show={state}>
        <div className={state ? "modal-content" :"modal-content modal-closing"} ref={node}>
          <div className="closing" onClick={()=>{setState(false)}}>
            <span>X</span>
          </div>
          <div>Replace with image</div>
          <h2>Press start to begin </h2>
        </div>
      </div>

  )
}

export default Modal
