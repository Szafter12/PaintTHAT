#ifndef GAMESERVER_ROOM_HPP
#define GAMESERVER_ROOM_HPP
#include <memory>
#include <vector>

#include "IRoomState.hpp"
#include "Player.hpp"

class Room {
public:
    Room(const std::string &pin);

    void changeState(std::unique_ptr<IRoomState> newState);
private:
    std::unique_ptr<IRoomState> currentState;
    std::vector<Player> players;
    std::vector<std::string> wordsPool {"Piwo", "WIMiP", "Wskaźnik"};
    std::string guessingWord;
    std::string pin;
};

#endif //GAMESERVER_ROOM_HPP
