#include <iostream>
#include <mutex>
#include <memory>
#include <unordered_map>
#include "crow.h"
#include <nlohmann/json.hpp>
#include "../include/Room.hpp"

using json = nlohmann::json;

int main() {
    auto app = crow::SimpleApp();

    std::unordered_map<std::string, std::unique_ptr<Room> > rooms;
    std::mutex roomsMutex;

    CROW_WEBSOCKET_ROUTE(app, "/ws")
            .onopen([&](crow::websocket::connection &conn) {
                std::cout << "New connection\n";
            })
            .onclose([&](crow::websocket::connection &conn, const std::string &reason) {
                std::cout << "Connection closed: " << reason << "\n";
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
                            conn.send_text(
                                R"({"type": "ERROR", "payload": {"code": "ROOM_EXISTS", "message": "Pokoj o tym PIN-ie juz istnieje!"}})");
                            return;
                        }

                        std::cout << "New room created with PIN: " << PIN << "\n";
                    } else {
                        const auto it = rooms.find(PIN);
                        if (it != rooms.end()) {
                            conn.send_text(
                                R"({"type": "ERROR", "payload": {"code": "ROOM_NOT_FOUND", "message": "Nie znaleziono pokoju!"}})");
                            return;
                        }

                        it->second->onPacket(conn, packet);
                    }
                } catch (const json::exception &e) {
                    std::cerr << "JSON ERROR: " << e.what() << std::endl;
                    conn.send_text(
                        R"({"type": "ERROR", "payload": {"code": "BAD_JSON", "message": "Niepoprawny format danych!"}})");
                }
            });

    app.port(18080).multithreaded().run();

    return 0;
}
