#include "../include/RoomStates.hpp"

#include "PacketBuilder.hpp"
#include "Room.hpp"

void LobbyState::onEnter(Room &room) {
}

void LobbyState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    /*
     * TODO
     * - LOBBY_UPDATE from client (rounds count, time etc.)
     */

    std::string type = packet.at("type");

    if (type == "PLAYER_JOIN") {
        std::string playerName = packet.at("payload").at("nickname");
        room.addPlayer(conn, playerName);

        json packetToSend = Packet::makeLobbyUpdate(room.getPin(), room.getPlayers());
        room.broadcastAll(packetToSend);
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
    if (room.is_drawStackEmpty()) room.prepareNewRoundQueue();

    const Player *drawer = room.popNextDrawer();
    if (!drawer) {
        /* TODO
         * - Implement change state to EndRound
        */
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

    if (type == "PICKED_WORD") {
        const std::string guessWord = packet.at("payload").at("guessWord");

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
    /*
     * TODO
     * - Checking drawer conn and is every player guessed then stop round and go to next
     * - Check guessing words and add players who guessed to
     */

    // if (!room.getCurrentDrawer()->getConn() || ) {
    //     room.stopCountdown();
    //     room.changeState(std::make_unique<RoundEndState>());
    // }
}

void RoundEndState::onEnter(Room &room) {

}

void RoundEndState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {

}

void EndGameState::onEnter(Room &room) {

}

void EndGameState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    
}
