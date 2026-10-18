#include "../include/Player.hpp"

Player::Player(const std::string &nick, crow::websocket::connection &conn)
    : nickname{nick}, conn(&conn) {
}

void Player::addPoints(const int amount) {
    this->points += amount;
}

std::string Player::getNick() const {
    return this->nickname;
}

int Player::getPoints() const {
    return this->points;
}

bool Player::getIsDrawer() const {
    return this->isDrawer;
}

void Player::setIsDrawer(bool drawer) {
    this->isDrawer = drawer;
}

crow::websocket::connection *Player::getConn() const {
    return this->conn;
}
