#ifndef GAMESERVER_ROOM_HPP
#define GAMESERVER_ROOM_HPP
#include <memory>
#include <vector>

#include "IRoomState.hpp"
#include "Player.hpp"


class Room {
public:
    Room(crow::websocket::connection &conn, const std::string &pin);

    void changeState(std::unique_ptr<IRoomState> newState);
    void onPacket(crow::websocket::connection &conn, const json &packet);

    void addPlayer(crow::websocket::connection &conn, std::string &playerName);

private:
    std::unique_ptr<IRoomState> currentState;
    crow::websocket::connection *hostConn{nullptr};
    std::vector<Player> players;
    std::vector<std::string> wordsPool{"Piwo", "WIMiP", "Wskaźnik"};
    std::string guessingWord;
    std::string pin;
};

#endif //GAMESERVER_ROOM_HPP
