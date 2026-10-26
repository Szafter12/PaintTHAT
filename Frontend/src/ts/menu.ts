import { assets } from './assets';

export function renderMenu(
	container: HTMLElement, 
	onHOST: (username: string) => void, 
	onPLAYER: (roomCode: string) => void
) {

	container.innerHTML = `
	<div class="menu">
	    <img src="${assets.logo}" alt="Logo" class="logo">
		<div class="menu-buttons">
			<button class="host-button" id="host-btn"></button>
			<button class="player-button" id="player-btn"></button>
	    </div>

		<!-- logowanie hosta -->
		<div id="login-section-host" class="hidden">
			<div class="control-group">
			  <label for="username">Nick/Email:</label>
			  <input type="text" id="username" class="game-input" placeholder="Wpisz nick..." value="">
			</div>
		
			<div class="control-group">
			 <label for="password">Hasło:</label>
			 <input type="password" id="password" class="game-input" placeholder="Wpisz hasło..." value="">
			</div>	
			<button class="return-button" id="return-from-host-btn"></button>
            <button class="start-button" id="create-lobby-btn"></button>
		</div>

		<!-- logowanie gracza -->
		<div id="login-section-player" class="hidden">
			<h3>Dołącz do rozgrywki</h3>
			<div class="control-group">
			  <label for="room-code">NUMER POKOJU</label>
			  <input type="text" id="room-code" class="game-input" placeholder="Wpisz numer..." value="">
			</div>
			<button class="return-button" id="return-from-player-btn"></button>
			<button class="start-button" id="join-lobby-btn"></button>
		</div>
	</div>
	`;

	const hostBTN = container.querySelector<HTMLButtonElement>('#host-btn');
	const playerBTN = container.querySelector<HTMLButtonElement>('#player-btn');
	const loginSectionHost = container.querySelector<HTMLDivElement>('#login-section-host');
	const loginSectionPlayer = container.querySelector<HTMLDivElement>('#login-section-player');
	const mainButtons = container.querySelector<HTMLDivElement>('.menu-buttons');
	
	const returnFromHostButton = container.querySelector<HTMLButtonElement>('#return-from-host-btn');
	const returnFromPlayerButton = container.querySelector<HTMLButtonElement>('#return-from-player-btn');

	const joinLobbyBTN = container.querySelector<HTMLButtonElement>('#join-lobby-btn');
	const createLobbyBTN = container.querySelector<HTMLButtonElement>('#create-lobby-btn');

	hostBTN?.addEventListener('click', () => {
		mainButtons?.classList.add('hidden');
		loginSectionHost?.classList.remove('hidden');
	});

	playerBTN?.addEventListener('click', () => {
		mainButtons?.classList.add('hidden');
		loginSectionPlayer?.classList.remove('hidden');
	});

	createLobbyBTN?.addEventListener('click', () => {
		const usernameInput = container.querySelector<HTMLInputElement>('#username');
		const username = usernameInput?.value.trim() || 'Gracz';
		onHOST(username);
	});
	
	joinLobbyBTN?.addEventListener('click', () => {
		const codeInput = container.querySelector<HTMLInputElement>('#room-code');
		const roomCode = codeInput?.value.trim() || '';
		onPLAYER(roomCode); 
	});

	returnFromHostButton?.addEventListener('click', () => {
		loginSectionHost?.classList.add('hidden');
		mainButtons?.classList.remove('hidden');
	});

	returnFromPlayerButton?.addEventListener('click', () => {
		loginSectionPlayer?.classList.add('hidden');
		mainButtons?.classList.remove('hidden');
	});
}