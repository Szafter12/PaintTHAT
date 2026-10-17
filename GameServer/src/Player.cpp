#include "../include/Player.hpp"

Player::Player(const std::string &nick) : nickname{nick} {}

void Player::addPoints(int amount) {
    this->points += amount;
}

std::string Player::getNick() const {
    return this->nickname;
}

int Player::getPoints() const {
    return this->points;
}
