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
    } else if (type == "LOBBY_UPDATE" && &conn == room.getHostConn()) {
        /*
         * TODO
         * - LOBBY_UPDATE from client (rounds count, time etc.)
         */
    } else if (type == "START_GAME" && &conn == room.getHostConn()) {
        if (room.getPlayersCount() < 2) {
            conn.send_text(
                Packet::makeError("NOT_ENOUGH_PLAYERS", "Potrzeba minimum 2 graczy, aby rozpoczac gre").dump());
            return;
        }

        room.prepareNewRoundQueue();
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

    json packetToOthers = Packet::makeWaitingForWord(room.getCurrentDrawer()->getNick());
    room.broadcastExcept(drawer->getConn(), packetToOthers);
}

void RoundStartState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    std::string type = packet.at("type");

    if (type == "PICKED_WORD" && room.getCurrentDrawer()->getConn() == &conn) {
        const std::string guessWord = packet.at("payload").at("guessWord");

        /*
         *TODO
         * - Add security check is word is from 3 words pool
         */
        if (!guessWord.empty()) {
            room.setGuessingWord(guessWord);
            room.changeState(std::make_unique<WhileRoundState>());
        }
    }
}

void WhileRoundState::onEnter(Room &room) {
    room.startCountdown(room.getRoundTime());
}

void WhileRoundState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    std::string type = packet.at("type");

    if (type == "SUBMIT_GUESS" && &conn != room.getCurrentDrawer()->getConn()) {
        std::string guessWord = packet.at("payload").at("guess");
        std::string nickname = room.getPlayerByConn(&conn)->getNick();

        switch (room.checkGuess(guessWord)) {
            case Guessing::Guessed: {
                int pointsForGuesser = room.addPointsToPlayers(&conn);
                room.addToGuessQueue(&conn);
                room.broadcastAll(Packet::makePlayerGuessedCorrectly(nickname, pointsForGuesser, room.getPlayerByConn(&conn)->getPoints()));

                if (room.isAllGuessed()) {
                    room.stopCountdown();
                    room.changeState(std::make_unique<RoundEndState>());
                    std::cout << "All guessed\n";
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
    } else if (type == "DRAW_STROKE" && &conn == room.getCurrentDrawer()->getConn()) {
        int x = packet.at("payload").at("x");
        int y = packet.at("payload").at("y");
        int prevX = packet.at("payload").at("prevX");
        int prevY = packet.at("payload").at("prevY");
        std::string color = packet.at("payload").at("color");
        int size = packet.at("payload").at("size");
        bool isEraser = packet.at("payload").at("isEraser");

        room.sendJson(room.getHostConn(), Packet::makeDrawerSendStrokeToHost(x,y,prevX,prevY,color,size,isEraser));
    }
}

void WhileRoundState::handleClose(Room &room, crow::websocket::connection &conn) {
    Player *drawer = room.getCurrentDrawer();

    if (drawer && drawer->getConn() == &conn) {
        room.stopCountdown();
        room.broadcastAll(Packet::makeDrawerQuitGame(drawer->getNick()));
        room.changeState(std::make_unique<RoundEndState>());
    }
}

void RoundEndState::onEnter(Room &room) {

    if (room.getCurrentRound() == room.getMaxRounds()) {
        room.changeState(std::make_unique<EndGameState>());
    } else {
        room.changeState(std::make_unique<RoundStartState>());
    }
}

void RoundEndState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
}

void EndGameState::onEnter(Room &room) {
}

void EndGameState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
}
