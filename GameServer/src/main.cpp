#include <iostream>
#include <mutex>
#include <memory>
#include <unordered_map>
#include "crow.h"
#include <nlohmann/json.hpp>
#include "PacketBuilder.hpp"
#include "../include/Room.hpp"

using json = nlohmann::json;

int main() {
    auto app = crow::SimpleApp();

    std::unordered_map<std::string, std::unique_ptr<Room> > rooms;
    std::unordered_map<crow::websocket::connection*, std::string> connectionToRoom;
    std::mutex roomsMutex;

    CROW_WEBSOCKET_ROUTE(app, "/ws")
            .onopen([&](crow::websocket::connection &conn) {
                std::cout << "New connection\n";
            })
            .onclose([&](crow::websocket::connection &conn, const std::string &reason) {
                std::lock_guard<std::mutex> lock(roomsMutex);

                auto it = connectionToRoom.find(&conn);
                if (it != connectionToRoom.end()) {
                    std::string PIN = it->second;
                    connectionToRoom.erase(it);

                    auto roomIt = rooms.find(PIN);
                    if (roomIt != rooms.end()) {
                        if (roomIt->second->getHostConn() == &conn) {
                            std::cout << "Host exit. Remove room: " << PIN << "\n";
                            rooms.erase(roomIt);
                        } else {
                            std::cout << "Player disconnect: " << PIN << "\n";
                            roomIt->second->onClose(conn);
                        }
                    }
                }
            })
            .onmessage([&](crow::websocket::connection &conn, const std::string &data, bool is_binary) {
                try {
                    json packet = json::parse(data);
                    std::string PIN = packet.at("pin");
                    std::string type = packet.at("type");

                    std::lock_guard<std::mutex> lock(roomsMutex);

                    if (type == "HOST_INIT") {
                        auto [it, inserted] = rooms.try_emplace(PIN, std::make_unique<Room>(conn, PIN));

                        if (!inserted) {
                            conn.send_text(Packet::makeError("ROOM_EXISTS", "Pokoj o tym PIN-ie juz istnieje").dump());
                            return;
                        }

                        connectionToRoom[&conn] = PIN;
                        std::cout << "New room created with PIN: " << PIN << "\n";
                    } else {
                        const auto it = rooms.find(PIN);
                        if (it == rooms.end()) {
                            conn.send_text(Packet::makeError("ROOM_NOT_FOUND", "Nie znaleziono pokoju").dump());
                            return;
                        }

                        if (type == "PLAYER_JOIN") {
                            connectionToRoom[&conn] = PIN;
                        }

                        it->second->onPacket(conn, packet);
                    }
                } catch (const json::exception &e) {
                    std::cerr << "JSON ERROR: " << e.what() << std::endl;
                    conn.send_text(Packet::makeError("BAD_JSON", "Niepoprawny format danych").dump());
                }
            });

    app.port(18080).multithreaded().run();

    return 0;
}
