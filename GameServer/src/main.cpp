#include <iostream>
#include "crow.h"

int main() {
    auto app = crow::SimpleApp();

    CROW_WEBSOCKET_ROUTE(app, "/ws")
        .onopen([&](crow::websocket::connection &conn) {

        })
        .onclose([&](crow::websocket::connection &conn, const std::string &reason) {

        })
        .onmessage([&](crow::websocket::connection &conn, const std::string &data, bool is_binary) {});

    app.port(18080).multithreaded().run();

    return 0;
}