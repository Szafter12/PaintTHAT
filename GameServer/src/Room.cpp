#include "../include/Room.hpp"
#include "../include/RoomStates.hpp"

Room::Room(crow::websocket::connection &conn, const std::string &pin) : hostConn(&conn), pin(pin) {
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
