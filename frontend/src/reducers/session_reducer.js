import {
  RECEIVE_USER_LOGOUT,
  RECEIVE_CURRENT_USER,
  RECEIVE_USER_SIGN_IN
} from "../actions/session_actions";

const initialState = {
  isAuthenticated: false,
  user: "Guest"
};

export default function(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_USER_LOGOUT:
      return {
        isAuthenticated: false,
        user: "Guest"
      };
    case RECEIVE_CURRENT_USER:
      return {
        isAuthenticated: true,
        user: action.currentUser
      };
    case RECEIVE_USER_SIGN_IN:
      return {
        ...state,
        isSignedIn: true,
        user: action.currentUser
      };
    default:
      return state;
  }
}
