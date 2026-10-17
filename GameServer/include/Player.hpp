#ifndef GAMESERVER_PLAYER_HPP
#define GAMESERVER_PLAYER_HPP

#include "crow.h"
#include <string>

class Player {
public:
    Player(const std::string &nick, crow::websocket::connection &conn);

    void addPoints(int amount);

    [[nodiscard]] std::string getNick() const;

    [[nodiscard]] int getPoints() const;

    [[nodiscard]] crow::websocket::connection *getConnection() const;

private:
    std::string nickname{"No name"};
    int points{0};
    crow::websocket::connection *conn{nullptr};
};

#endif //GAMESERVER_PLAYER_HPP
