import React from 'react'

function StreamItem(props) {
	return (
		props.format === 'true' ?
    	<dl>
      		{Object.entries(props.json).map(([key,value]) => (
        	// Without the `key`, React will fire a key warning
        		<React.Fragment key={key}>
          			<dt>{key}</dt>
          			<dd>{value}</dd>
        		</React.Fragment>
      		))}
    	</dl>
		:
		<ul>
			{Object.entries(props.json).map(([key,value]) => (
				<React.Fragment key={key}>
          			<li>{key} : {value}</li>
				</React.Fragment>
      		))}
		</ul>
  );
}

export default StreamItem;

// name,
// type, //rtp etc
// id,
// description,
// video,
// videoport,
// videoopt,
// videortpmap,
// videofmtp,