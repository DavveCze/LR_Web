
import React from 'react';

type Props = {
	headline: string;
	content: string;
	link: string;
	buttonLabel?: string;
	cost: string;
	isActive: boolean;
};

export const RegistrationComponent: React.FC<Props> = ({
	headline,
	content,
	link,
	buttonLabel = 'REGISTRACE',
}) => {
	return (
		<div style={containerStyle}>
			<div style={leftStyle}>
				<h2 style={headlineStyle}>{headline}</h2>
				<p style={contentStyle}>{content}</p>
			</div>
			<div style={rightStyle}>
				<a href={link} style={buttonStyle}>
					{buttonLabel}
				</a>
			</div>
		</div>
	);
};

const containerStyle: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: '24px 16px',
	borderBottom: '1px solid #eee',
};

const leftStyle: React.CSSProperties = {
	flex: 1,
};

const rightStyle: React.CSSProperties = {
	marginLeft: '24px',
};

const headlineStyle: React.CSSProperties = {
	margin: 0,
	fontSize: '20px',
	color: '#333',
};

const contentStyle: React.CSSProperties = {
	margin: '6px 0 0 0',
	color: '#777',
};

const buttonStyle: React.CSSProperties = {
	display: 'inline-block',
	background: '#333',
	color: '#fff',
	padding: '14px 28px',
	textDecoration: 'none',
	letterSpacing: '0.5px',
};

export default RegistrationComponent;
