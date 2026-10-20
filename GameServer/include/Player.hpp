#ifndef GAMESERVER_PLAYER_HPP
#define GAMESERVER_PLAYER_HPP

#include "crow.h"
#include <string>

class Player {
public:
    Player(const std::string &nick, crow::websocket::connection &conn);

    // Modifiers
    void addPoints(int amount);

    // Getters
    [[nodiscard]] std::string getNick() const;
    [[nodiscard]] int getPoints() const;
    [[nodiscard]] bool getIsDrawer() const;
    [[nodiscard]] bool getIsGuessed() const;
    [[nodiscard]] crow::websocket::connection *getConn() const;

    // Setters
    void setIsDrawer(bool drawer);
    void setIsGuessed(bool guessed);

private:
    std::string nickname{"No name"};
    int points{0};
    bool isDrawer{false};
    bool isGuessed{false};
    crow::websocket::connection *conn{nullptr};
};

#endif //GAMESERVER_PLAYER_HPP
