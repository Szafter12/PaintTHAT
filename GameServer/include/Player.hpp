#ifndef GAMESERVER_PLAYER_HPP
#define GAMESERVER_PLAYER_HPP

#include "crow.h"
#include <string>

class Player {
public:
    Player(const std::string &nick);
    void addPoints(int amount);

    [[nodiscard]] std::string getNick() const;
    [[nodiscard]] int getPoints() const ;
private:
    std::string nickname{"No name"};
    int points{0};
    crow::websocket::connection* conn;
};

#endif //GAMESERVER_PLAYER_HPP
