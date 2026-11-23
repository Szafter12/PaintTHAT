#ifndef GAMESERVER_ROOM_HPP
#define GAMESERVER_ROOM_HPP
#include <memory>
#include <vector>
#include <atomic>
#include <queue>
#include <random>
#include "IRoomState.hpp"
#include "Player.hpp"
#include "PacketBuilder.hpp"
#include "RoomStates.hpp"
#include "Helper.hpp"

enum class Guessing {
    Guessed,
    Miss,
    Almost_Guess
};

class Room {
public:
    // Constructor & Destructor
    Room(crow::websocket::connection &conn, const std::string &pin);

    // Handling state
    void changeState(std::unique_ptr<IRoomState> newState);

    void onPacket(crow::websocket::connection &conn, const json &packet);

    void onClose(crow::websocket::connection &conn);

    // Handling room
    void setupRoom(const json &packet);

    // Handling players
    void addPlayer(crow::websocket::connection &conn, std::string_view playerName);

    Player *popNextDrawer();

    int addPointsToPlayers(const crow::websocket::connection *conn);

    // Timer
    void startCountdown(int seconds);

    void stopCountdown();

    // JSON communication
    void broadcastAll(const json &packet) const;

    static void sendJson(crow::websocket::connection *conn, const json &packet);

    void broadcastExcept(const crow::websocket::connection *conn, const json &packet) const;

    // Words selection
    Guessing checkGuess(std::string_view guess) const;

    [[nodiscard]] const std::vector<std::string> &drawThreeWordsFromPool();

    [[nodiscard]] bool selectWordFromChoices(const std::string &chosenWord);

    void prepareNewRoundQueue();

    // Setters
    void setGuessingWord(const std::string &word);

    void addToGuessQueue(const crow::websocket::connection *conn);

    void nextRound();

    // Getters
    std::vector<Player> getPlayers() const;

    Player *getCurrentDrawer();

    Player *getPlayerByConn(const crow::websocket::connection *conn);

    [[nodiscard]] bool isEndGame() const;

    [[nodiscard]] int getPlayersCount() const;

    [[nodiscard]] bool is_round_ends();

    [[nodiscard]] bool is_drawStackEmpty() const;

    [[nodiscard]] bool isAllGuessed() const;

    [[nodiscard]] const std::string &getPin() const;

    [[nodiscard]] int getRoundTime() const;

    [[nodiscard]] int getCurrentRound() const;

    [[nodiscard]] int getMaxRounds() const;

    [[nodiscard]] const std::string &getSecretWord() const;

    [[nodiscard]] crow::websocket::connection *getHostConn() const;

    [[nodiscard]] int getTimeLeft() const;

    [[nodiscard]] size_t getGuessedPlayersCount() const;

    [[nodiscard]] const std::vector<std::string> &getCurrentWordsChoices() const;

private:
    // State and room
    std::unique_ptr<IRoomState> currentState;
    crow::websocket::connection *hostConn{nullptr};
    std::string pin;

    // Players
    std::vector<Player> players;
    std::vector<size_t> drawStack;
    std::vector<size_t> guessedQueue;

    // Words
    std::vector<std::string> wordsPool;
    std::vector<std::string> backupWordsPool;
    std::vector<std::string> currentWordsChoices;
    std::string guessingWord;

    // Round
    int roundTime{0};
    int currentRound{0};
    int maxRounds{0};
    std::atomic<bool> round_ends_holder{false};

    // Timer
    std::mutex roomMutex;
    std::jthread timerThread;
    std::mutex timerMutex;
    std::condition_variable_any timerCv;
    std::atomic<int> timeLeft{0};

    void initWordPool(std::vector<std::string> words);

    void roundCountdownWorker(const std::stop_token &stoken, int seconds);
};

#endif //GAMESERVER_ROOM_HPP
