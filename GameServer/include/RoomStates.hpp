#ifndef GAMESERVER_ROOMSTATES_HPP
#define GAMESERVER_ROOMSTATES_HPP
#include "IRoomState.hpp"

class LobbyState : public IRoomState {
public:
    void handlePacket(Room &room, json &packet) override;
};

#endif //GAMESERVER_ROOMSTATES_HPP
