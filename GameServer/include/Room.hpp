#ifndef GAMESERVER_ROOM_HPP
#define GAMESERVER_ROOM_HPP
#include <memory>
#include <vector>
#include <atomic>
#include <stack>

#include "IRoomState.hpp"
#include "Player.hpp"

class Room {
public:
    Room(crow::websocket::connection &conn, const std::string &pin);

    void changeState(std::unique_ptr<IRoomState> newState);

    void onPacket(crow::websocket::connection &conn, const json &packet);

    void addPlayer(crow::websocket::connection &conn, std::string &playerName);

    void roundCountdown(int seconds);

    void broadcastMsg(const json &packet);

    Player *getCurrentDrawer();

    [[nodiscard]] int getPlayersCount() const;

    [[nodiscard]] bool is_round_ends();

private:
    std::unique_ptr<IRoomState> currentState;
    crow::websocket::connection *hostConn{nullptr};
    std::string pin;

    std::vector<Player> players;
    std::vector<size_t> drawStack;

    std::vector<std::string> wordsPool{"Piwo", "WIMiP", "Wskaźnik"};
    std::string guessingWord;

    int roundTime{0};
    int currentRound{0};
    int maxRounds{0};
    std::atomic<bool> round_ends_holder{false};
};

#endif //GAMESERVER_ROOM_HPP
