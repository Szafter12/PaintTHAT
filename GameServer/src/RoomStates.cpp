#include "../include/RoomStates.hpp"

#include "PacketBuilder.hpp"
#include "Room.hpp"

void LobbyState::onEnter(Room &room) {
    json packet = Packet::makeLobbyInitiated(room.getMaxRounds(), room.getRoundTime());
    room.broadcastAll(packet);
}

void LobbyState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    std::string type = packet.at("type");

    if (type == "PLAYER_JOIN") {
        std::string playerName = packet.at("payload").at("nickname");
        room.addPlayer(conn, playerName);

        json packetToSend = Packet::makeLobbyUpdate(room.getPin(), room.getPlayers());
        room.broadcastAll(packetToSend);
    } else if (type == "KICK_PLAYER" && &conn == room.getHostConn()) {
        std::string targetNick = packet.at("payload").at("nickname");
        if (room.kickPlayer(targetNick)) {
            room.broadcastAll(Packet::makeLobbyUpdate(room.getPin(), room.getPlayers()));
        }
    } else if (type == "START_GAME" && &conn == room.getHostConn()) {
        if (room.getPlayersCount() < 2) {
            conn.send_text(
                Packet::makeError("NOT_ENOUGH_PLAYERS", "Potrzeba minimum 2 graczy, aby rozpoczac gre").dump());
            return;
        }

        room.setupRoom(packet);
        room.prepareNewRoundQueue();
        room.broadcastAll(Packet::makeGameStarted());
        room.changeState(std::make_unique<RoundStartState>());
    }
}

void RoundStartState::onEnter(Room &room) {
    room.nextRound();
    if (room.is_drawStackEmpty()) room.prepareNewRoundQueue();

    const Player *drawer = room.popNextDrawer();
    if (!drawer) {
        room.changeState(std::make_unique<RoundEndState>());
        return;
    }

    std::vector<std::string> threeWords = room.drawThreeWordsFromPool();

    json packetToDrawer = Packet::makeChooseWord(threeWords);
    room.sendJson(drawer->getConn(), packetToDrawer);

    json packetToOthers = Packet::makeWaitingForWord(drawer->getNick());
    room.broadcastExcept(drawer->getConn(), packetToOthers);
    if (room.getHostConn()) {
        room.sendJson(room.getHostConn(), packetToOthers);
    }
}

void RoundStartState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    std::string type = packet.at("type");

    if (type == "PICKED_WORD" && room.getCurrentDrawer() && room.getCurrentDrawer()->getConn() == &conn) {
        const std::string guessWord = packet.at("payload").at("guessWord");

        if (room.selectWordFromChoices(guessWord)) {
            room.changeState(std::make_unique<WhileRoundState>());
        }
    }
}

void WhileRoundState::onEnter(Room &room) {
    room.startCountdown(room.getRoundTime());
}

void WhileRoundState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    std::string type = packet.at("type");

    if (type == "SUBMIT_GUESS" && room.getCurrentDrawer() && &conn != room.getCurrentDrawer()->getConn()) {
        Player *guesser = room.getPlayerByConn(&conn);
        if (!guesser) return;

        std::string guessWord = packet.at("payload").at("guess");
        std::string nickname = guesser->getNick();

        switch (room.checkGuess(guessWord)) {
            case Guessing::Guessed: {
                int pointsForGuesser = room.addPointsToPlayers(&conn);
                room.addToGuessQueue(&conn);
                room.broadcastAll(
                    Packet::makePlayerGuessedCorrectly(nickname, pointsForGuesser, guesser->getPoints()));

                if (room.isAllGuessed()) {
                    room.stopCountdown();
                    room.changeState(std::make_unique<RoundEndState>());
                }

                break;
            }
            case Guessing::Miss: {
                room.broadcastAll(Packet::makePlayerGuessedMiss(nickname, guessWord));
                break;
            }
            case Guessing::Almost_Guess: {
                room.sendJson(&conn, Packet::makePlayerGuessedAlmost(nickname, guessWord));
                break;
            }

            default:
                break;
        }
    } else if (type == "DRAW_BROADCAST" && room.getCurrentDrawer() && &conn == room.getCurrentDrawer()->getConn()) {
        if (room.getHostConn()) {
            room.getHostConn()->send_text(packet.dump());
        }
    } else if (type == "CLEAR_CANVAS" && room.getCurrentDrawer() && &conn == room.getCurrentDrawer()->getConn()) {
        if (room.getHostConn()) {
            room.getHostConn()->send_text(packet.dump());
        }
    }
}

void RoundEndState::onEnter(Room &room) {
    room.broadcastAll(Packet::makeEndRound(room.getPlayers(), room.getSecretWord()));
    std::ranges::for_each(room.getPlayers(), [](auto &player) { player.resetCurrentRoundPoints(); });
}

void RoundEndState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    std::string type = packet.at("type");

    if (type == "NEXT_ROUND" && &conn == room.getHostConn()) {
        if (room.getCurrentRound() >= room.getMaxRounds()) {
            room.changeState(std::make_unique<EndGameState>());
        } else {
            room.changeState(std::make_unique<RoundStartState>());
        }
    }
}

void EndGameState::onEnter(Room &room) {
    room.stopCountdown();
    room.broadcastAll(Packet::makeGameSummary(room.getPlayers()));
}

void EndGameState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    if (const std::string &type = packet.at("type").get<std::string>(); type == "BACK_TO_LOBBY") {
        if (!room.getHostConn() || room.getHostConn() != &conn) {
            return;
        }

        for (auto &player: room.getPlayers()) {
            player.resetPoints();
            player.resetCurrentRoundPoints();
            player.setIsGuessed(false);
            player.setIsDrawer(false);
        }

        room.broadcastAll(Packet::makeBackToLobby());
        room.broadcastAll(Packet::makeLobbyUpdate(room.getPin(), room.getPlayers()));
        room.changeState(std::make_unique<LobbyState>());
    }
}

void LobbyState::handleClose(Room &room, crow::websocket::connection &conn,
                             const std::string &leftNick, bool wasDrawer) {
}

void RoundStartState::handleClose(Room &room, crow::websocket::connection &conn,
                                  const std::string &leftNick, bool wasDrawer) {
    if (wasDrawer) {
        room.broadcastAll(Packet::makeDrawerQuitGame(leftNick));
    }

    if (room.getPlayersCount() < 2) {
        room.broadcastAll(Packet::makeError("NOT_ENOUGH_PLAYERS", "Za mało graczy, aby kontynuować grę."));
        room.changeState(std::make_unique<EndGameState>());
        return;
    }

    if (wasDrawer) {
        room.changeState(std::make_unique<RoundEndState>());
    }
}

void WhileRoundState::handleClose(Room &room, crow::websocket::connection &conn,
                                  const std::string &leftNick, bool wasDrawer) {
    if (wasDrawer) {
        room.stopCountdown();
        room.broadcastAll(Packet::makeDrawerQuitGame(leftNick));
    }

    if (room.getPlayersCount() < 2) {
        room.stopCountdown();
        room.broadcastAll(Packet::makeError("NOT_ENOUGH_PLAYERS", "Za mało graczy, aby kontynuować grę."));
        room.changeState(std::make_unique<EndGameState>());
        return;
    }

    if (wasDrawer) {
        room.changeState(std::make_unique<RoundEndState>());
        return;
    }

    if (room.isAllGuessed()) {
        room.stopCountdown();
        room.changeState(std::make_unique<RoundEndState>());
    }
}

void RoundEndState::handleClose(Room &room, crow::websocket::connection &conn,
                                const std::string &leftNick, bool wasDrawer) {
    if (room.getPlayersCount() < 2) {
        room.broadcastAll(Packet::makeError("NOT_ENOUGH_PLAYERS", "Za mało graczy, aby kontynuować grę."));
        room.changeState(std::make_unique<EndGameState>());
    }
}

void EndGameState::handleClose(Room &room, crow::websocket::connection &conn,
                               const std::string &leftNick, bool wasDrawer) {
}
