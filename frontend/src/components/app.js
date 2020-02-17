import React from "react";
import { Switch, Route } from "react-router-dom";
import { AuthRoute } from "../util/route_util";
import MainPage from "./main/main_page";
import LoginContainer from "./session/login_form_container";
import SignupContainer from "./session/signup_form_container";
import GameViewContainer from "./game/gameview_container";
import Lobby from "./main/lobby/lobby";
import Play from "./main/lobby/play";
import PageNotFound from "./main/page_not_found";
import Leaderboard from "./main/leaderboard/leaderboard";
import OptionsContainer from "./main/options/options_container";


const App = () => (
  
    <Switch>
      <AuthRoute exact path="/" component={MainPage} />
      <Route exact path="/login" component={LoginContainer} />
      <Route exact path="/signup" component={SignupContainer} />
      <Route exact path="/game" component={GameViewContainer}/>
      <Route exact path="/lobby" component={Lobby} />
      <Route exact path="/play" component={Play} />
      <Route exact path="/leaderboard" component={Leaderboard} />
      <Route exact path="/options" component={OptionsContainer} />
      <Route component={PageNotFound}/> 
    </Switch>
  


);

export default App;
