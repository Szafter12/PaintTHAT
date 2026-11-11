#ifndef GAMESERVER_PACKETBUILDER_HPP
#define GAMESERVER_PACKETBUILDER_HPP

#include <nlohmann/json.hpp>
#include <string>
#include <vector>
#include "Player.hpp"

using json = nlohmann::json;

namespace Packet {
    inline json makeError(std::string_view code, std::string_view message) {
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

    inline json makeLobbyUpdate(std::string_view pin, const std::vector<Player> &players) {
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

    inline json makeGameStarted() {
        return {
            {"type", "GAME_STARTED"},
            {
                "payload", {}
            }
        };
    }

    inline json makeWaitingForWord(std::string_view drawerNick) {
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

    inline json makePlayerGuessedCorrectly(std::string_view name, int pointAwarded, int totalPoints) {
        return {
            {"type", "PLAYER_GUESSED_CORRECTLY"},
            {
                "payload", {
                    {"nickname", name},
                    {"pointAwarded", pointAwarded},
                    {"totalPoints", totalPoints}
                }
            }
        };
    }

    inline json makePlayerGuessedMiss(std::string_view name, std::string_view guessWord) {
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

    inline json makePlayerGuessedAlmost(std::string_view name, std::string_view guessWord) {
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

    inline json makeDrawerQuitGame(std::string_view drawerNick) {
        return {
            {"type", "DRAWER_QUIT"},
            {
                "payload", {
                    {"nickname", drawerNick}
                }
            }
        };
    }

    inline json makeEndRound(const std::vector<Player> &players, std::string_view revealedWord) {
        json playersArray = json::array();

        for (const auto &p : players) {
            playersArray.push_back({
                {"nickname", p.getNick()},
                //{"avatar", p->getAvatar(},
                {"score", p.getPoints()},
                {"roundScore", p.getPointsCurrentRound()}
            });
        }

        return {
            {"type", "ROUND_END"},
            {
                "payload", {
                    {"word", std::string(revealedWord)},
                    {"leaderboard", playersArray}
                }
            }
        };
    }

    inline json makePlayerCloseConnection(std::string_view playerNick) {
        return {
            {"type", "PLAYER_CLOSE"},
            {
                "payload", {
                    {"playerNick", playerNick}
                }
            }
        };
    }

    inline json makeGameSummary(const std::vector<Player> &players) {
        std::vector<const Player*> sorted;

        sorted.reserve(players.size());
        for (const auto &p : players) {
            sorted.push_back(&p);
        }

        std::sort(sorted.begin(), sorted.end(), [](const Player* a, const Player* b) {
            return a->getPoints() > b->getPoints();
        });

        json leaderboard = json::array();
        int place = 1;
        for (const auto &p : sorted) {
            leaderboard.push_back({
                {"place", place++},
                {"nickname", p->getNick()},
                //{"avatar", p->getAvatar()},
                {"score", p->getPoints()}
            });
        }

        return {
            {"type", "GAME_OVER"},
            {
                "payload", {
                    {"leaderboard", leaderboard}
                }
            }
        };
    }

    inline json makeBackToLobby() {
        return {
            {"type", "BACK_TO_LOBBY"},
            {"payload", json::object()}
        };
    }
}

#endif //GAMESERVER_PACKETBUILDER_HPP
