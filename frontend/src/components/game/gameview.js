import React from 'react';
import ClientGame from '../../classes/game/client_game'

class GameView extends React.Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket
    this.room = this.props.room
  }

  componentDidMount() {
    if (!this.socket) window.location.href = "/";
    this.socket.emit('enter-room', this.room)
    this.clientGame = new ClientGame(this.socket, this.room, this.props.user, this.props.team, this.props.gameoptions);
    this.clientGame.init();
  };
  
  componentWillUnmount() {
    if (this.socket) {
      this.socket.emit('leave-game', this.room)
      this.socket.disconnect();
    }
  }

  render() {
    return (
      <div id="game-container">
        <canvas width="1600" height="900" id="hud-canvas"></canvas>
        <canvas width="1600" height="900" id="game-canvas"></canvas>
        <canvas width="1600" height="900" id="background-canvas"></canvas>
      </div>
    );
  }
};

export default GameView;
