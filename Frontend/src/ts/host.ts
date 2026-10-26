import {assets} from "./assets";
import '../styles/host.css';

export function renderHost(container: HTMLElement, username: string, onLogout: () => void) {
	const customWords: string[] = [];

	container.innerHTML = `
	<div class="host">

	<header class= "host-header">
		<div class="logo-area">
			<img src="${assets.logo}" alt="Logo" class="logo">
		</div>
        <div class="user-actions">
			<div class="host-profile">${username}</div>
			<button id="logout-btn" class="logout-btn"></button>
		</div>
	</header>

	<main class="host-main">
		<div class="panel left-panel">
            <h2>Kod Pokoju:</h2>
		</div>
		<div class="panel right-panel">
			<h3 class="panel-subtitle">POŁĄCZENI GRACZE</h3>
			<h3>Ustawienia:</h3>
			<div class="control-group">
			  <label for="round">ilość rund:</label>
			  <input type="text" id="round" class="game-input" placeholder="Wpisz liczbę rund..." value="">
			</div>
			<div class="control-group">
			  <label for="time">długość rundy:</label>
			  <input type="text" id="time" class="game-input" placeholder="Wpisz długość rundy..." value="">
			</div>

			<div class="control-group" style="margin-top: 20px; width: 100%;">
					<label for="newword">Własne słowa:</label>
					<div style="display: flex; gap: 10px; margin-top: 5px;">
						<input type="text" id="newword" class="game-input" placeholder="Wpisz własne słowa..." value="">
						<button id="add-word-btn">Dodaj</button>
					</div>
				</div>

				
				<h3>Twoja lista słów:</h3>
				<ul id="words-list" style="list-style-type: disc; padding-left: 20px; max-height: 150px; overflow-y: auto;">
					<li style="color: gray;">Brak własnych słów...</li>
				</ul>

			<button class="start-button" id="join-lobby-btn"></button>
		</div>
	</main>
	
	</div>
	`;

	const logoutBtn = container.querySelector<HTMLButtonElement>('#logout-btn');
	const addWordBtn = container.querySelector<HTMLButtonElement>('#add-word-btn');
	const wordInput = container.querySelector<HTMLInputElement>('#newword'); 
	const wordsListContainer = container.querySelector<HTMLUListElement>('#words-list'); 

	
	function updateWordsDisplay() {
		if (!wordsListContainer) return;

		if (customWords.length === 0) {
			wordsListContainer.innerHTML = `<li style="color: gray;">Brak własnych słów...</li>`;
			return;
		}
		wordsListContainer.innerHTML = customWords
			.map(word => `<li>${word}</li>`)
			.join('');
	}

	logoutBtn?.addEventListener('click', () => {
		onLogout();
    });

	addWordBtn?.addEventListener('click', () => {
		if (!wordInput) return;
		const wordText = wordInput.value.trim();

		if (wordText !== '') {
			customWords.push(wordText);			
			wordInput.value = '';
			updateWordsDisplay(); 
		}
	});

	wordInput?.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			addWordBtn?.click();
		}
	});
}