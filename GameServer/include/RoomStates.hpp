#ifndef GAMESERVER_ROOMSTATES_HPP
#define GAMESERVER_ROOMSTATES_HPP
#include "IRoomState.hpp"
#include <algorithm>

class LobbyState : public IRoomState {
public:
    void onEnter(Room &room) override;

    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;

    void handleClose(Room &room, crow::websocket::connection &conn,
                     const std::string &leftNick, bool wasDrawer) override;
};

class RoundStartState : public IRoomState {
public:
    void onEnter(Room &room) override;

    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;

    void handleClose(Room &room, crow::websocket::connection &conn,
                     const std::string &leftNick, bool wasDrawer) override;
};

class WhileRoundState : public IRoomState {
public:
    void onEnter(Room &room) override;

    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;

    void handleClose(Room &room, crow::websocket::connection &conn,
                     const std::string &leftNick, bool wasDrawer) override;
};

class RoundEndState : public IRoomState {
public:
    void onEnter(Room &room) override;

    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;

    void handleClose(Room &room, crow::websocket::connection &conn,
                     const std::string &leftNick, bool wasDrawer) override;
};

class EndGameState : public IRoomState {
public:
    void onEnter(Room &room) override;

    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;

    void handleClose(Room &room, crow::websocket::connection &conn,
                     const std::string &leftNick, bool wasDrawer) override;
};

#endif //GAMESERVER_ROOMSTATES_HPP
