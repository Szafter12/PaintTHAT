#include "../include/Room.hpp"
#include "../include/RoomStates.hpp"

Room::Room(const std::string &pin) : pin(pin) {
    this->currentState = std::make_unique<LobbyState>();
}

void Room::changeState(std::unique_ptr<IRoomState> newState) {
    this->currentState = std::move(newState);
}
