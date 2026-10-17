#ifndef GAMESERVER_IROOMSTATE_HPP
#define GAMESERVER_IROOMSTATE_HPP
#include <string>
#include <nlohmann/json.hpp>
#include "crow.h"

using json = nlohmann::json;

class Room;

class IRoomState {
public:
    virtual ~IRoomState() = default;

    virtual void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    }
};

#endif
