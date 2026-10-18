#include "../include/Room.hpp"
#include "../include/RoomStates.hpp"

Room::Room(crow::websocket::connection &conn, const std::string &pin) : hostConn(&conn), pin(pin), roundTime(60) {
    this->currentState = std::make_unique<LobbyState>();
}

void Room::changeState(std::unique_ptr<IRoomState> newState) {
    this->currentState = std::move(newState);
}

void Room::onPacket(crow::websocket::connection &conn, const json &packet) {
    this->currentState->handlePacket(*this, conn, packet);
}

void Room::addPlayer(crow::websocket::connection &conn, std::string &playerName) {
    this->players.emplace_back(playerName, conn);
}

void Room::roundCountdown(int seconds) {
    for (int i{seconds}; i > 0; i--) {
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    this->round_ends_holder = true;
}

void Room::broadcastMsg(const json &packet) {
}

Player *Room::getCurrentDrawer() {
    for (auto &player: this->players) {
        if (player.getIsDrawer() && player.getConn()) return &player;
    }

    return nullptr;
}


int Room::getPlayersCount() const {
    return this->players.size();
}

bool Room::is_round_ends() {
    return this->round_ends_holder;
}
