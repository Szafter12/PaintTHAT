#include "../include/Player.hpp"

Player::Player(const std::string &nick, crow::websocket::connection &conn)
    : nickname{nick}, conn(&conn) {
}

void Player::addPoints(const int amount) {
    if (this->isDrawer) {
        this->pointsCurrentRound += amount;
        return;
    }

    this->pointsCurrentRound = amount;
    this->points += amount;
}

const std::string &Player::getNick() const {
    return this->nickname;
}

int Player::getPoints() const {
    return this->points;
}

bool Player::getIsDrawer() const {
    return this->isDrawer;
}

bool Player::getIsGuessed() const {
    return this->isGuessed;
}

crow::websocket::connection *Player::getConn() const {
    return this->conn;
}

int Player::getPointsCurrentRound() const {
    return this->pointsCurrentRound;
}

void Player::setIsDrawer(bool drawer) {
    this->isDrawer = drawer;
}

void Player::setIsGuessed(bool guessed) {
    this->isGuessed = guessed;
}

void Player::resetCurrentRoundPoints() {
    this->pointsCurrentRound = 0;
}

void Player::resetConn() {
    this->conn = nullptr;
}

void Player::resetPoints() {
    this->points = 0;
}

void Player::setConn(crow::websocket::connection &connection) {
    this->conn = &connection;
}
