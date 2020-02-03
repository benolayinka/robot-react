//props = userList, activeUser
import React from 'react'
import {ListGroup} from 'react-bootstrap'

//how are we going to add video?

export default function StreamControllerUserList(props) {

    if(!props.userList)
        return null

    const listItems = props.userList.map((user) =>
        <ListGroup.Item
            key={user.uuid} 
            action variant='dark'
            disabled
            active={props.activeUser && props.activeUser.uuid === user.uuid}
            >
            {user.name}
            {props.activeUser && props.activeUser.uuid === user.uuid && ' - driving!'}
        </ListGroup.Item>
    );

    return(
        <ListGroup variant="flush">
            <strong>online now</strong>
            {listItems}
        </ListGroup>
    )
}