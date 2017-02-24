import React from 'react';
import Chat from './ChatView.jsx';
import GameOver from './GameOver.jsx'

class Game extends React.Component {
	constructor() {
		super()
		this.state = {
			gameover: false
		}
	} 

	componentDidMount() {
		var socket = window.socket;
		var context = this;
		
		socket.on('gameoverlisten', function() {
				context.setState({
					gameover: true
				})
		console.log('gameover!')
			});
  }

  render() {
    return (
      <div className="Game">
			{console.log(window.gameover)}
      	<Chat/>
      	{this.state.gameover ? <GameOver/> : ''}
      </div>
    );
  }
}

export default Game;