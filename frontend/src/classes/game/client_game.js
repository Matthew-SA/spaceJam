import Ball from "./entities/ball";
import Ship from "./entities/ship";
import Booster from "./entities/booster";

class ClientGame {
  constructor(socket, room, user) {
    this.socket = socket;
    this.room = room;
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext("2d");

    this.ball = new Ball();
    this.self = new Ship(this.ctx, user);
    this.boosters = new Booster();
    this.shipAngle = 0;
    this.boosterPosX = 0;
    this.boosterPosY = 0;
    

    /// NEW CODE FOR SHIPS - TEMPORARY?
    this.shipSprite = new Image();
    this.shipSprite.src = 'images/default_ship.png';

    this.others = [];
    this.othersPrev = [];

    document.addEventListener('keydown', e => {
      if (e.keyCode === 13 && this.winner) window.location.href = "/"
    })
  }

  cycleAll(ctx, data) {
    if (!this.winner) {
      this.clearEntities(ctx)
      this.stepEntities(data)
      this.drawEntities(ctx)
    }
  }

  clearEntities(ctx) {
    this.ball.clear(ctx)
    this.self.clear(ctx)
    this.clearOthers(ctx);
  }

  stepEntities(data) {
    this.ball.step(data)
    this.self.step(data)
    this.stepOthers(data);
  }

  drawEntities(ctx) {
    this.ball.draw(ctx);
    this.self.draw(ctx)
    this.drawOthers(ctx);
  }

  clearOthers(ctx) {
    for (let player of this.others) {
      ctx.clearRect(this.pos.x - 100, this.pos.y - 80, 200, 200);
    }
  }

  // clearAllBoosters(ctx) {
  //   for (let player of this.others) {
  //     this.ctx.clearRect(player.pos.x - 100, player.pos.y - 100, 250, 280);
  //   }
  // }

  stepOthers(data) {
    this.othersPrev = this.others;
    this.others = data.others;
  }

  // stepAllBoosters(data) {
  //   this.allBoosterPosPrev = this.allBoosterPos
  //   this.allBoosterPos = data.ships
  // }

  drawOthers(ctx) {
    for (let i = 0; i < this.others.length; i++){
        let jetDirection = this.others[i].jetDirection;
        if(jetDirection.x === 0 && jetDirection.y === 0){
          this.boosterPosX = false;
          this.boosterPosY = false;
        }
          else if(jetDirection.x > 0 && jetDirection.y > 0){
          this.shipAngle = 45;
          this.boosterPosX = 95;
          this.boosterPosY = -467;
        } else if(jetDirection.x > 0 && jetDirection.y < 0){
          this.shipAngle = 135;
          this.boosterPosX = 121;
          this.boosterPosY = -163;
        } else if(jetDirection.y < 0 && jetDirection.x < 0){
          this.shipAngle = 225;
          this.boosterPosX = -182;
          this.boosterPosY = -134;
        } else if(jetDirection.y > 0 && jetDirection.x < 0){
          this.shipAngle = 315;
          this.boosterPosX = -212;
          this.boosterPosY = -437;
        } else if(jetDirection.y > 0){
          this.shipAngle = 0;
          this.boosterPosX = -65;
          this.boosterPosY = -515;
        } else if(jetDirection.x > 0) {
          this.shipAngle = 90;
          this.boosterPosX = 169;
          this.boosterPosY = -320;
        } else if(jetDirection.y < 0) {
          this.shipAngle = 180;
          this.boosterPosX = -25;
          this.boosterPosY = -83;
        } else if(jetDirection.x < 0) {
          this.shipAngle = 270;
          this.boosterPosX = -260;
          this.boosterPosY = -280;
        } 

        if(this.boosterPosX || this.boosterPosY){
          this.boosters.draw(
            this.ctx,
            ((this.shipAngle + 180) * Math.PI) / 180,
            this.others[i].pos.x + this.boosterPosX,
            this.others[i].pos.y + this.boosterPosY
          );
        }

        ctx.setTransform(1, 0, 0, 1, this.others[i].pos.x, this.others[i].pos.y);
        ctx.rotate((this.shipAngle * Math.PI) / 180);
        ctx.drawImage(this.shipSprite, -60 / 2, -60 / 2);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.fillStyle = "#FFFFFF"
        ctx.font = "16pt Audiowide";
        ctx.fillText(this.user, this.others[i].pos.x, this.others[i].pos.y + 60);
        ctx.textAlign = "center";
      }
  }
}

export default ClientGame;