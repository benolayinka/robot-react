//props = userList, activeUser
import React from 'react'
import {ListGroup} from 'react-bootstrap'
import './StreamControllerUserList.scss'

//how are we going to add video?

export default function StreamControllerUserList(props) {

    if(!props.userList)
        return null

    const listItems = props.userList.map((user) =>
        <li
            key={user.uuid} 
            >
            <span 
                className={props.activeUser && props.activeUser.uuid === user.uuid ? "font-weight-bold" : ""}
            >
            {user.name}
            {props.activeUser && props.activeUser.uuid === user.uuid && ' - driving!'}
            </span>
        </li>
    );

    return(
        <>
        <strong className="font-weight-bold">online now</strong>
        <ul className="unstyled-list">
            {listItems}
        </ul>
        </>
    )
}