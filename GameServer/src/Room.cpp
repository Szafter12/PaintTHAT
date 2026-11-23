#include "../include/Room.hpp"

namespace {
    std::mt19937 &getRng() {
        static std::mt19937 rng{std::random_device{}()};
        return rng;
    }
}

Room::Room(crow::websocket::connection &conn, const std::string &pin)
    : hostConn(&conn), pin(pin), roundTime(600), maxRounds(4) {
    this->changeState(std::make_unique<LobbyState>());
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

void Room::removePlayerAt(size_t idx) {
    if (idx >= this->players.size()) return;
    this->players.erase(this->players.begin() + static_cast<std::ptrdiff_t>(idx));

    std::vector<size_t> updatedStack;
    updatedStack.reserve(this->drawStack.size());
    for (size_t stackIdx: this->drawStack) {
        if (stackIdx == idx) continue;
        updatedStack.push_back(stackIdx > idx ? stackIdx - 1 : stackIdx);
    }
    this->drawStack = std::move(updatedStack);
}

bool Room::kickPlayer(std::string_view nickname) {
    auto it = std::ranges::find_if(this->players, [nickname](const Player &p) {
        return p.getNick() == nickname;
    });
    if (it == this->players.end()) return false;

    crow::websocket::connection *targetConn = it->getConn();
    size_t idx = static_cast<size_t>(std::distance(this->players.begin(), it));

    this->removePlayerAt(idx);

    if (targetConn) {
        targetConn->send_text(Packet::makeKicked("Host usunął Cię z pokoju.").dump());
        targetConn->close();
    }

    return true;
}

void Room::onHostDisconnect() {
    this->stopCountdown();

    std::lock_guard<std::mutex> lock(this->roomMutex);
    this->hostConn = nullptr;

    const std::string msg = Packet::makeError(
        "HOST_LEFT",
        "Host opuścił pokój. Rozgrywka została zakończona."
    ).dump();

    for (auto &player: this->players) {
        if (crow::websocket::connection *pConn = player.getConn()) {
            player.resetConn();
            pConn->send_text(msg);
            pConn->close();
        }
    }
    this->players.clear();
    this->drawStack.clear();
}

void Room::onClose(crow::websocket::connection &conn) {
    std::lock_guard<std::mutex> lock(this->roomMutex);

    auto it = std::ranges::find_if(this->players, [&conn](const Player &p) {
        return p.getConn() == &conn;
    });
    if (it == this->players.end()) return;

    std::string leftNick = it->getNick();
    bool wasDrawer = it->getIsDrawer();
    size_t idx = static_cast<size_t>(std::distance(this->players.begin(), it));

    this->removePlayerAt(idx);

    broadcastAll(Packet::makeLobbyUpdate(pin, players));
    broadcastAll(Packet::makePlayerCloseConnection(leftNick));

    if (this->currentState) {
        this->currentState->handleClose(*this, conn, leftNick, wasDrawer);
    }
}

void Room::setupRoom(const json &packet) {
    const auto &payload = packet.at("payload");
    this->currentRound = 0;
    int maxRounds_p = payload.at("maxRounds").get<int>();
    int roundTime_p = payload.at("roundTime").get<int>();

    this->maxRounds = std::max(1, maxRounds_p);
    this->roundTime = std::max(10, roundTime_p);
    this->initWordPool(payload.at("words").get<std::vector<std::string> >());

    for (auto &player: this->players) {
        player.resetPoints();
        player.resetCurrentRoundPoints();
        player.setIsGuessed(false);
        player.setIsDrawer(false);
    }
}

void Room::addPlayer(crow::websocket::connection &conn, std::string_view playerName) {
    if (auto it = std::ranges::find_if(this->players, [playerName](const auto &player) -> bool {
        return player.getNick() == playerName;
    }); it != this->players.end()) {
        it->setConn(conn);
    } else {
        this->players.emplace_back(std::string(playerName), conn);
    }
}

void Room::broadcastAll(const json &packet) const {
    const std::string serialized = packet.dump();

    if (this->hostConn) {
        this->hostConn->send_text(serialized);
    }

    for (const auto &player: this->players) {
        if (player.getConn()) {
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

Player *Room::getPlayerByConn(const crow::websocket::connection *conn) {
    if (!conn) return nullptr;

    for (auto &player: this->players) {
        if (player.getConn() == conn) return &player;
    }

    return nullptr;
}

const std::vector<Player> &Room::getPlayers() const {
    return this->players;
}

std::vector<Player> &Room::getPlayers() {
    return this->players;
}

void Room::setGuessingWord(const std::string &word) {
    this->guessingWord = word;
}

void Room::addToGuessQueue(const crow::websocket::connection *conn) {
    for (size_t i{0}; i < this->players.size(); ++i) {
        if (this->players[i].getConn() != nullptr && this->players[i].getConn() == conn) {
            this->guessedQueue.push_back(i);
            this->players[i].setIsGuessed(true);
        }
    }
}

int Room::getPlayersCount() const {
    int count{0};
    for (auto &player: this->players) {
        if (player.getConn() != nullptr) {
            count++;
        }
    }

    return count;
}

bool Room::is_round_ends() {
    return this->round_ends_holder;
}

bool Room::is_drawStackEmpty() const {
    return this->drawStack.empty();
}

bool Room::isAllGuessed() const {
    for (const auto &player: this->players) {
        if (!player.getConn() || player.getIsDrawer()) continue;
        if (!player.getIsGuessed()) return false;
    }

    return true;
}

const std::string &Room::getPin() const {
    return this->pin;
}

void Room::prepareNewRoundQueue() {
    this->drawStack.clear();

    for (size_t i{0}; i < this->players.size(); ++i) {
        if (this->players[i].getConn()) {
            this->drawStack.push_back(i);
        }
    }

    static std::mt19937 rng{std::random_device{}()};
    std::ranges::shuffle(this->drawStack, rng);
}

Guessing Room::checkGuess(std::string_view guess) const {
    const std::string normalizedGuess = Helper::normalizeForComparison(guess);
    const std::string correctWord = Helper::normalizeForComparison(this->guessingWord);

    if (correctWord == normalizedGuess) {
        return Guessing::Guessed;
    } else if (Helper::levenshtein_distance(normalizedGuess, correctWord) <= 1) {
        return Guessing::Almost_Guess;
    } else {
        return Guessing::Miss;
    }
}

Player *Room::popNextDrawer() {
    for (auto &p: players) {
        p.setIsDrawer(false);
        p.setIsGuessed(false);
    }

    while (!this->drawStack.empty()) {
        size_t idx = this->drawStack.back();
        this->drawStack.pop_back();

        if (idx < this->players.size() && this->players[idx].getConn()) {
            this->players[idx].setIsDrawer(true);
            return &this->players[idx];
        }
    }

    return nullptr;
}

int Room::addPointsToPlayers(const crow::websocket::connection *conn) {
    int order = this->getGuessedPlayersCount();

    int pointsForGuesser = std::max(100, 400 - (order * 50));

    if (this->timeLeft > (this->roundTime / 2)) {
        pointsForGuesser += 150;
    }

    int pointsForDrawer = 50;

    Player *guesser = this->getPlayerByConn(conn);
    Player *drawer = this->getCurrentDrawer();

    if (guesser) guesser->addPoints(pointsForGuesser);
    if (drawer) drawer->addPoints(pointsForDrawer);

    return pointsForGuesser;
}

void Room::sendJson(crow::websocket::connection *conn, const nlohmann::json &packet) {
    if (conn != nullptr) {
        conn->send_text(packet.dump());
    }
}

void Room::broadcastExcept(const crow::websocket::connection *conn, const json &packet) const {
    const std::string serialized = packet.dump();
    for (auto &player: this->players) {
        if (!player.getConn() || player.getConn() == conn) continue;
        player.getConn()->send_text(serialized);
    }
}

void Room::initWordPool(std::vector<std::string> words) {
    this->backupWordsPool = words;
    this->wordsPool = std::move(words);
    std::ranges::shuffle(this->wordsPool, getRng());
}

void Room::nextRound() {
    this->currentRound++;
}

bool Room::isEndGame() const {
    return this->currentRound > this->maxRounds;
}

int Room::getRoundTime() const {
    return this->roundTime;
}

int Room::getCurrentRound() const {
    return this->currentRound;
}

int Room::getMaxRounds() const {
    return this->maxRounds;
}

const std::vector<std::string> &Room::drawThreeWordsFromPool() {
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

    return this->currentWordsChoices;
}

bool Room::selectWordFromChoices(const std::string &chosenWord) {
    if (const auto it = std::ranges::find(this->currentWordsChoices, chosenWord);
        it == this->currentWordsChoices.end()) {
        return false;
    }

    this->guessingWord = chosenWord;

    for (const auto &word: this->currentWordsChoices) {
        if (word != chosenWord) {
            this->wordsPool.push_back(word);
        }
    }
    std::ranges::shuffle(this->wordsPool, getRng());

    this->currentWordsChoices.clear();
    return true;
}

const std::string &Room::getSecretWord() const {
    return this->guessingWord;
}

crow::websocket::connection *Room::getHostConn() const {
    return this->hostConn;
}

int Room::getTimeLeft() const {
    return this->timeLeft;
}

size_t Room::getGuessedPlayersCount() const {
    size_t guessedPlayersCount = 0;
    for (const auto &player: this->players) {
        if (player.getConn() && player.getIsGuessed()) {
            guessedPlayersCount++;
        }
    }
    return guessedPlayersCount;
}

const std::vector<std::string> &Room::getCurrentWordsChoices() const {
    return this->currentWordsChoices;
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
            this->timeLeft.store(i);
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
