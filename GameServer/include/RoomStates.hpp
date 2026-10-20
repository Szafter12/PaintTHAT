#ifndef GAMESERVER_ROOMSTATES_HPP
#define GAMESERVER_ROOMSTATES_HPP
#include "IRoomState.hpp"

class LobbyState : public IRoomState {
public:
    void onEnter(Room &room) override;
    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;
};

class RoundStartState : public IRoomState {
public:
    void onEnter(Room &room) override;
    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;
};

class WhileRoundState : public IRoomState {
public:
    void onEnter(Room &room) override;
    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;
};

class RoundEndState : public IRoomState {
public:
    void onEnter(Room &room) override;
    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;
};

class EndGameState : public IRoomState {
public:
    void onEnter(Room &room) override;
    void handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) override;
};

#endif //GAMESERVER_ROOMSTATES_HPP
