import { renderMenu } from './menu.ts';
import { renderHost } from './host.ts';
import { renderPlayerMenu } from './playermenu.ts';
const app = document.querySelector<HTMLDivElement>('#app');

function showMenu() {
	if (app) {
		renderMenu(app, (username) => {
			showHost(username);
		},
			(roomCode) => {
				showPlayerMenu(roomCode);
			}
		);
	}
}

function showHost(username: string) {
	if (app) {
		renderHost(app, username, () => {
			showMenu();
		});
	}
}

function showPlayerMenu(roomCode: string) {
	if (app) {
		console.log("Przełączam na widok wpisywania kodu dla Gracza!", roomCode);
	}
}

showMenu();