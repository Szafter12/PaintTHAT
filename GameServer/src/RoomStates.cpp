#include "../include/RoomStates.hpp"

#include "Room.hpp"

void LobbyState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    /*
     * TODO
     * - LOBBY_UPDATE from client
     */
    try {
        std::string type = packet.at("type");

        if (type == "PLAYER_JOIN") {
            std::string playerName = packet.at("payload").at("nickname");
            room.addPlayer(conn, playerName);

            json playersArray = json::array();

            room.setPlayerArray(playersArray);

            json packetToSend = {
                {"type", "LOBBY_UPDATE"},
                {
                    "payload", {
                        {"pin", room.getPin()},
                        {"players", playersArray}
                    }
                }
            };

            room.broadcastAll(packetToSend);
        } else if (type == "START_GAME") {
            room.changeState(std::make_unique<RoundStartState>());
        }
    } catch (const json::exception &e) {
        std::cerr << "JSON ERROR: " << e.what() << std::endl;
        conn.send_text(
            R"({"type": "ERROR", "payload": {"code": "BAD_JSON", "message": "Niepoprawny format danych!"}})");
    }
}

void RoundStartState::onEnter(Room &room) {
    Player *drawer = room.popNextDrawer();
    if (!drawer) {
        return;
    }

    std::vector<std::string> threeWords = room.drawThreeWordsFromPool();

    json packetToDrawer = {
        {"type", "CHOOSE_WORD"},
        {
            "payload", {
                {"words", threeWords}
            }
        }
    };
    room.sendJson(drawer->getConn(), packetToDrawer);

    json packetToOthers = {
        {"type", "WAITING_FOR_WORD"},
        {
            "payload", {
                {"drawer", drawer->getNick()}
            }
        }
    };
    room.broadcastExcept(drawer->getConn(), packetToOthers);
}

void RoundStartState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    // #1 Pick drawer
    // #2 Send to drawer 3 words to pick (remove this 3 words from pool)
    // #3 Get picked word from drawer and set guessWord
}
