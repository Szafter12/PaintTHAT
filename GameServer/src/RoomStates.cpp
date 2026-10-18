#include "../include/RoomStates.hpp"

#include "Room.hpp"

void LobbyState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {
    try {
        std::string type = packet.at("type");

        if (type == "PLAYER_JOIN") {
            std::string playerName = packet.at("payload").at("nickname");
            room.addPlayer(conn, playerName);
        } else if (type == "START_GAME") {
            room.changeState(std::make_unique<RoundStartState>());
        }
    } catch (const json::exception &e) {
        std::cerr << "JSON ERROR: " << e.what() << std::endl;
        conn.send_text(
            R"({"type": "ERROR", "payload": {"code": "BAD_JSON", "message": "Niepoprawny format danych!"}})");
    }
}

void RoundStartState::handlePacket(Room &room, crow::websocket::connection &conn, const json &packet) {


}
