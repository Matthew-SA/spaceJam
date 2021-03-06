const Matter = require("matter-js");
const ServerEngine = require('./server_engine')
const ServerPlayer = require('./server_player')

class ServerGame extends ServerEngine {
  constructor(io, room) {
    super();
    this.io = io;
    this.room = room;
    this.roster = new Map();
    this.score = { RED: 0, BLUE: 0 };
    this.timeout = 0;
    this.isLive = false;
  }

  init() {
    if (this.live) return;
    if (this.roster.size > 6) return;
    if (this.checkForNeutral()) return;
    setInterval(() => {
      if (this.timeout > 0) this.timeout--
      Matter.Engine.update(this.engine, 20);
      this.sendGameState();
    }, 20);
    
    this.activateScoreLogic();
    this.checkCollisions();
    this.isLive = true;
    this.io.in(`room-${this.room}`).emit('start-game');
    this.io.in('room-lobby').emit(`start-${this.room}`, this.isLive);
    this.initializeOtherProfiles();
    this.reset();
  }

  setTeam(id, team) {
    let player = this.roster.get(id);
    player.team = team;
    this.sendPlayerListing();
  }

  checkForNeutral() {
    let players = [...this.roster.values()];
    for (let player of players) {
      if (player.team === null) return true;
    }
    return false;
  }

  sendPlayerListing() {
    let players = [...this.roster.values()];
    let playerListings = {
      neutral: players.map(player => !player.team ? player.user : " "),
      redTeam: players.map(player => player.team === 'red' ? player.user : " "),
      blueTeam: players.map(player => player.team === 'blue' ? player.user : " "),
    }
    this.io.in(`room-${this.room}`).emit('update-listing', playerListings);
    this.io.in('room-lobby').emit(`update-${this.room}`, this.roster.size);
  }

  addPlayer(id, username, gameOptions) {
    this.roster.set(id, new ServerPlayer(id, username, gameOptions, this.world));
    this.sendPlayerListing();
  }

  removePlayer(id) {
    let player = this.roster.get(id);
    if (!player) return;
    this.roster.delete(id);
    Matter.Composite.remove(this.world, player.ship);
    this.initializeOtherProfiles();
    this.sendPlayerListing();
  }

  initializeOtherProfiles() {
    let players = [...this.roster.values()];
    for (let id of this.roster.keys()) {
      this.io.to(id).emit('initialize-others', { 
        others: this.getOthersProfile(id, players)
      })
    }
  }

  getOthersProfile(selfId, players) {
    let others = players.filter((player) => player.id != selfId);
    return others.map(player => this.getProfile(player));
  }

  getProfile(player) {
    return { user: player.user, ship: player.gameOptions.ship, team: player.team }
  }

  movePlayer(id, data) {
    if (this.timeout) return;
    let player = this.roster.get(id);
    if (player) player.move(data.keyboardState);
  }

  sendGameState() {
    let players = [...this.roster.values()];
    for (let id of this.roster.keys()) {
      let player = this.roster.get(id);
      this.io.to(id).emit('gameState', {
        self: this.getPlayerInfo(player),
        others: this.getOthersInfo(id, players),
        ball: {
          x: Math.floor(this.ball.position.x),
          y: Math.floor(this.ball.position.y),
          angle: this.ball.angle.toFixed(1)
        }
      });
    }
  }

  getPlayerInfo(player) {
    let result = {
      pos: {
        x: Math.floor(player.ship.position.x),
        y: Math.floor(player.ship.position.y) 
      },
      jetDirection: Object.assign({}, player.jetDirection)
    }
    player.resetJetDirection();
    return result;
  }

  getOthersInfo(selfId, players) {
    let others = players.filter((player) => player.id != selfId);
    return others.map(player => this.getPlayerInfo(player));
  }


  activateScoreLogic() {
    // Check if ball has passed through goal sensor

    Matter.Events.on(this.engine, "collisionStart", (event) => {
      const pairs = event.pairs;

      for (let i = 0, j = pairs.length; i !== j; ++i) {
        let pair = pairs[i];

        if (pair.bodyA === this.leftSensor || pair.bodyB === this.leftSensor) {
          this.score.BLUE += 1;
          Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(this.ball, 0);

          for (let id of this.roster.keys()) {
            let player = this.roster.get(id)
            if (player.ship.position.x < 900) {
              Matter.Body.setVelocity(player.ship, { x: 80, y: -(this.ball.position.y - player.ship.position.y) / 6 });
            }
          }
          Matter.Body.setPosition(this.ball, { x: -9999, y: 900 })

          this.io.in('room-' + this.room).emit('updateScore', this.score)
          if (this.score.RED < 5 && this.score.BLUE < 5) {
            setTimeout(() => {
              this.reset();
            }, 3000);
          }

        } else if (pair.bodyA === this.rightSensor || pair.bodyB === this.rightSensor) {
          this.score.RED += 1;
          Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(this.ball, 0);

          for (let id of this.roster.keys()) {
            let player = this.roster.get(id)
            if (player.ship.position.x > 2900) {
              Matter.Body.setVelocity(player.ship, { x: -80, y: -(this.ball.position.y - player.ship.position.y) / 6 });
            }
          }
          Matter.Body.setPosition(this.ball, { x: -9999, y: 900 })

          this.io.in('room-' + this.room).emit('updateScore', this.score)

          if (this.score.RED < 5 && this.score.BLUE < 5) {
            setTimeout(() => {
              this.reset();
            }, 3000);
          }
        }

        if (this.score.RED === 5) {
          this.io.in('room-' + this.room).emit('gameover', "RED");
        } else if (this.score.BLUE === 5) {
          this.io.in('room-' + this.room).emit('gameover', "BLUE");
        }
      }
    });
  }

  checkCollisions() {
    let players = this.roster.values();
    let ships = [];

    for (let player of players) {
      ships.push(player.ship);
    }
    

    Matter.Events.on(this.engine, "collisionStart", (event) => {
      const pairs = event.pairs;

      for (let i = 0, j = pairs.length; i !== j; ++i) {
        let pair = pairs[i];

        // check if a ship collided with a ball
        if (ships.includes(pair.bodyA) && pair.bodyB === this.ball || ships.includes(pair.bodyB) && pair.bodyA === this.ball) {
          // emit that collision has occurred and that it was a ball-ship collision
          this.io.in('room-' + this.room).emit('collision', { type: 'ship-ball' });
        }

        // check if a ship collided with another ship
        if (ships.includes(pair.bodyA) && ships.includes(pair.bodyB)) {
          // emit that collision has occurred and that it was a ship-ship collision
          this.io.in('room-' + this.room).emit('collision', { type: 'ship-ship' });
        }

        // check if a ship collided with a wall
        if (this.walls.includes(pair.bodyA) && ships.includes(pair.bodyB) || this.walls.includes(pair.bodyB) && ships.includes(pair.bodyA)) {
          // emit that collision has occurred and that it was a ship-wall collision
          this.io.in('room-' + this.room).emit('collision', { type: 'ship-wall' });
        }

        // check if a ball collided with a wall
        if (this.walls.includes(pair.bodyA) && pair.bodyB === this.ball || this.walls.includes(pair.bodyB) && pair.bodyA === this.ball) {
          // emit that collision has occurred and that it was a ball-wall collision
          this.io.in('room-' + this.room).emit('collision', { type: 'ball-wall' });
        }
      }
    })
  } 

  reset() {
    this.timeout = 150;

    let players = [...this.roster.values()]
    let redPos = [{ x: 470, y: 900 }, { x: 600, y: 223 }, { x: 600, y: 1578 }];
    let bluePos = [{ x: 3330, y: 900 }, { x: 3200, y: 1580 }, { x: 3200, y: 233 }];

    for (let i = 0; i < players.length; i++) {
      if (players[i].team === 'red') {
        Matter.Body.setVelocity(players[i].ship, { x: 0, y: 0 });
        Matter.Body.setPosition(players[i].ship, redPos.shift());
      }
      if (players[i].team === 'blue') {
        Matter.Body.setVelocity(players[i].ship, { x: 0, y: 0 });
        Matter.Body.setPosition(players[i].ship, bluePos.shift());
      }
    }

    Matter.Body.setPosition(this.ball, { x: 1900, y: 900 });
    Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(this.ball, 0);
    Matter.Body.setAngle(this.ball, 0);
  }
};

module.exports = ServerGame;