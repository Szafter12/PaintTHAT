// Główne grafiki i logo
import logoImg from './images/LOGO.gif';
import nameImg from './images/name.gif';
import borderImg from './images/BORDER.gif';
import border0Img from './images/border0.gif';
import border1Img from './images/border1.gif';

// Przyciski menu i nawigacji
import host0Img from './images/HOST0.gif';
import host1Img from './images/HOST1.gif';
import player0Img from './images/PLAYER0.gif';
import player1Img from './images/PLAYER1.gif';
import return0Img from './images/RETURN0.gif';
import return1Img from './images/RETURN1.gif';
import left0Img from './images/left0.gif';
import left1Img from './images/left1.gif';
import right0Img from './images/right0.gif';
import right1Img from './images/right1.gif';
import signin0Img from './images/signin0.gif';
import signin1Img from './images/signin1.gif';
import signup0Img from './images/signup0.gif';
import signup1Img from './images/signup1.gif';
import start0Img from './images/START0.gif';
import start1Img from './images/START1.gif';

// Awatary
import avatar0 from './images/avatars/avatar0.gif';
import avatar1 from './images/avatars/avatar1.gif';
import avatar2 from './images/avatars/avatar2.gif';
import avatar3 from './images/avatars/avatar3.gif';
import avatar4 from './images/avatars/avatar4.gif';
import avatar6 from './images/avatars/avatar6.gif';
import avatar7 from './images/avatars/avatar7.gif';

export const ASSETS = {
  logo: logoImg,
  name: nameImg,
  borders: {
    default: borderImg,
    active: border0Img,
    hover: border1Img,
  },
  buttons: {
    host: [host0Img, host1Img],
    player: [player0Img, player1Img],
    return: [return0Img, return1Img],
    left: [left0Img, left1Img],
    right: [right0Img, right1Img],
    signin: [signin0Img, signin1Img],
    signup: [signup0Img, signup1Img],
    start: [start0Img, start1Img],
  },
  avatars: [avatar0, avatar1, avatar2, avatar3, avatar4, avatar6, avatar7],
} as const;