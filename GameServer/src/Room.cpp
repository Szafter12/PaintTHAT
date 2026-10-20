#include "../include/Room.hpp"

namespace {
    std::mt19937 &getRng() {
        static std::mt19937 rng{std::random_device{}()};
        return rng;
    }
}

Room::Room(crow::websocket::connection &conn, const std::string &pin)
    : hostConn(&conn), pin(pin), roundTime(60), maxRounds(4) {
    this->currentState = std::make_unique<LobbyState>();
}

void Room::changeState(std::unique_ptr<IRoomState> newState) {
    this->currentState = std::move(newState);

    if (this->currentState) {
        this->currentState->onEnter(*this);
    }
}

void Room::onPacket(crow::websocket::connection &conn, const json &packet) {
    std::lock_guard<std::mutex> lock(this->roomMutex);
    this->currentState->handlePacket(*this, conn, packet);
}

void Room::addPlayer(crow::websocket::connection &conn, std::string &playerName) {
    this->players.emplace_back(playerName, conn);
}

void Room::broadcastAll(const json &packet) const {
    const std::string serialized = packet.dump();

    if (this->hostConn != nullptr) {
        this->hostConn->send_text(serialized);
    }

    for (const auto &player: this->players) {
        if (player.getConn() != nullptr) {
            player.getConn()->send_text(serialized);
        }
    }
}

Player *Room::getCurrentDrawer() {
    for (auto &player: this->players) {
        if (player.getIsDrawer() && player.getConn()) return &player;
    }

    return nullptr;
}

std::vector<Player> Room::getPlayers() const {
    return this->players;
}

void Room::setGuessingWord(const std::string &word) {
    this->guessingWord = word;
}

int Room::getPlayersCount() const {
    return this->players.size();
}

bool Room::is_round_ends() {
    return this->round_ends_holder;
}

bool Room::is_drawStackEmpty() const {
    return this->drawStack.empty();
}

std::string Room::getPin() const {
    return this->pin;
}

void Room::prepareNewRoundQueue() {
    this->drawStack.clear();

    for (size_t i{0}; i < this->getPlayersCount(); ++i) {
        if (this->players[i].getConn() != nullptr) {
            this->drawStack.push_back(i);
        }
    }

    static std::mt19937 rng{std::random_device{}()};
    std::ranges::shuffle(this->drawStack, rng);

    this->currentRound++;
}

Guessing Room::checkGuess(std::string &guess) const {
    guess = Helper::normalizeForComparison(guess);
    const std::string correctWord = Helper::normalizeForComparison(this->guessingWord);

    if (correctWord == guess) {
        return Guessing::Guessed;
    } else if (Helper::levenshtein_distance(guess, correctWord) <= 1) {
        return Guessing::Almost_Guess;
    } else {
        return Guessing::Miss;
    }
}

Player *Room::popNextDrawer() {
    for (auto &p: players) {
        p.setIsDrawer(false);
    }

    while (!this->drawStack.empty()) {
        size_t idx = this->drawStack.back();
        this->drawStack.pop_back();

        if (this->players[idx].getConn() != nullptr) {
            this->players[idx].setIsDrawer(true);
            return &this->players[idx];
        }
    }

    return nullptr;
}

void Room::sendJson(crow::websocket::connection *conn, const nlohmann::json &packet) {
    if (conn != nullptr) {
        conn->send_text(packet.dump());
    }
}

void Room::broadcastExcept(const crow::websocket::connection *conn, const json &packet) const {
    for (auto &player: this->players) {
        if (player.getConn() == conn) continue;
        player.getConn()->send_text(packet.dump());
    }
}

void Room::initWordPool(const std::vector<std::string> &words) {
    this->backupWordsPool = words;
    this->wordsPool = words;
    std::ranges::shuffle(this->wordsPool, getRng());
}

bool Room::isEndGame() const {
    return this->currentRound > this->maxRounds;
}

int Room::getRoundTime() const {
    return this->roundTime;
}

std::vector<std::string> Room::drawThreeWordsFromPool() {
    this->currentWordsChoices.clear();

    if (this->wordsPool.size() < 3 && !this->backupWordsPool.empty()) {
        this->wordsPool = this->backupWordsPool;
        std::ranges::shuffle(this->wordsPool, getRng());
    }

    const size_t count = std::min<size_t>(3, this->wordsPool.size());
    for (size_t i = 0; i < count; ++i) {
        this->currentWordsChoices.push_back(std::move(this->wordsPool.back()));
        wordsPool.pop_back();
    }

    return currentWordsChoices;
}

bool Room::selectWordFromChoices(const std::string &chosenWord) {
    auto it = std::ranges::find(this->currentWordsChoices, chosenWord);
    if (it == this->currentWordsChoices.end()) {
        return false;
    }

    this->guessingWord = chosenWord;

    /* If we want in the future 2 other words back in pool
    for (const auto& word : currentWordChoices) {
        if (word != chosenWord) {
            wordPool.push_back(word);
        }
    }
    std::shuffle(wordPool.begin(), wordPool.end(), getRng());
    */

    this->currentWordsChoices.clear();
    return true;
}

const std::string &Room::getSecretWord() const {
    return this->guessingWord;
}

crow::websocket::connection *Room::getHostConn() const {
    return this->hostConn;
}

void Room::startCountdown(int seconds) {
    stopCountdown();
    this->round_ends_holder = false;

    this->timerThread = std::jthread([this, seconds](const std::stop_token &stoken) {
        this->roundCountdownWorker(stoken, seconds);
    });
}

void Room::stopCountdown() {
    if (this->timerThread.joinable()) {
        this->timerThread.request_stop();
        this->timerCv.notify_all();

        if (std::this_thread::get_id() != this->timerThread.get_id()) {
            this->timerThread.join();
        }
    }
}

void Room::roundCountdownWorker(const std::stop_token &stoken, int seconds) {
    for (int i = seconds; i > 0; --i) {
        {
            std::unique_lock<std::mutex> timerLock(this->timerMutex);
            if (this->timerCv.wait_for(timerLock, stoken, std::chrono::seconds(1), [] { return false; })) {
                return;
            }
        }

        if (stoken.stop_requested()) return;

        json packet = Packet::makeTimeLeft(i - 1);

        std::lock_guard<std::mutex> roomLock(this->roomMutex);
        this->broadcastAll(packet);
    }

    if (stoken.stop_requested()) return;

    this->round_ends_holder = true;

    std::lock_guard<std::mutex> roomLock(this->roomMutex);
    this->changeState(std::make_unique<RoundEndState>());
}
