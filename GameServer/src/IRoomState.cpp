#include "../include/IRoomState.hpp"
#include "../include/Room.hpp"

void IRoomState::handleClose(Room &room, crow::websocket::connection &conn) {
    room.sendJson(room.getHostConn(), Packet::makePlayerCloseConnection(room.getPlayerByConn(&conn)->getNick()));
    room.getPlayerByConn(&conn)->resetConn();
}
