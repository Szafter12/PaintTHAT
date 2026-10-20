#ifndef GAMESERVER_PACKETBUILDER_HPP
#define GAMESERVER_PACKETBUILDER_HPP

#include <nlohmann/json.hpp>
#include <string>
#include <vector>
#include "Player.hpp"

using json = nlohmann::json;

namespace Packet {
    inline json makeError(const std::string &code, const std::string &message) {
        return {
            {"type", "ERROR"},
            {
                "payload", {
                    {"code", code},
                    {"message", message}
                }
            }
        };
    }

    inline json makeLobbyUpdate(const std::string &pin, const std::vector<Player> &players) {
        json playersArray = json::array();
        for (const auto &p: players) {
            playersArray.push_back({
                {"nickname", p.getNick()},
                {"points", p.getPoints()}
            });
        }

        return {
            {"type", "LOBBY_UPDATE"},
            {
                "payload", {
                    {"pin", pin},
                    {"players", playersArray}
                }
            }
        };
    }

    inline json makeChooseWord(const std::vector<std::string> &threeWords) {
        return {
            {"type", "CHOOSE_WORD"},
            {
                "payload", {
                    {"words", threeWords}
                }
            }
        };
    }

    inline json makeWaitingForWord(const std::string &drawerNick) {
        return {
            {"type", "WAITING_FOR_WORD"},
            {
                "payload", {
                    {"drawer", drawerNick}
                }
            }
        };
    }

    inline json makeTimeLeft(int secondsLeft) {
        return {
            {"type", "TIME_LEFT"},
            {
                "payload", {
                    {"time", secondsLeft}
                }
            }
        };
    }

    inline json makeLobbyInitiated(int maxRounds, int roundTime) {
        return {
            {"type", "LOBBY_INITIATED"},
            {
                "payload", {
                    {"maxRounds", maxRounds},
                    {"roundTime", roundTime}
                }
            }
        };
    }

    inline json makePlayerGuessedCorrectly(std::string &name) {
        return {
            {"type", "PLAYER_GUESSED_CORRECTLY"},
            {
                "payload", {
                    {"nickname", name}
                }
            }
        };
    }

    inline json makePlayerGuessedMiss(std::string &name, std::string &guessWord) {
        return {
            {"type", "PLAYER_GUESSED_MISS"},
            {
                "payload", {
                    {"nickname", name},
                    {"guessWord", guessWord}
                }
            }
        };
    }

    inline json makePlayerGuessedAlmost(std::string &name, std::string &guessWord) {
        return {
            {"type", "PLAYER_GUESSED_ALMOST"},
            {
                "payload", {
                    {"nickname", name},
                    {"guessWord", guessWord}
                }
            }
        };
    }
}

#endif //GAMESERVER_PACKETBUILDER_HPP
