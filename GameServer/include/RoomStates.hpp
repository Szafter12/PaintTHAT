#ifndef GAMESERVER_ROOMSTATES_HPP
#define GAMESERVER_ROOMSTATES_HPP
#include "IRoomState.hpp"

class LobbyState : public IRoomState {
public:
    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;
};

#endif //GAMESERVER_ROOMSTATES_HPP
