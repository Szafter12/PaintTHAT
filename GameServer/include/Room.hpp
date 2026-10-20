#ifndef GAMESERVER_ROOM_HPP
#define GAMESERVER_ROOM_HPP
#include <memory>
#include <vector>
#include <atomic>
#include <random>
#include "IRoomState.hpp"
#include "Player.hpp"
#include "Helper.hpp"

#define MOCK_WORDS "pies", "kot", "ryba", "ptak", "drzewo", "kwiat", "słońce", "księżyc", "chmura", "dom", "okno", "drzwi", "krzesło", "stół", "łóżko", "lampa", "książka", "auto", "rower", "statek", "samolot", "pociąg", "jabłko", "banan", "pizza", "ser", "chleb", "woda", "kawa", "herbata", "buty", "spodnie", "czapka", "zegarek", "klucz", "telefon", "komputer", "myszka", "gitara", "bęben", "szkoła", "zamek", "plaża", "góry", "las", "ogień", "woda", "ziemia", "wiatr", "król", "królowa", "rycerz", "smok", "pirat", "duch", "wampir", "robot", "kosmonauta", "obcy", "ninja", "kucharz", "lekarz", "policjant", "strażak", "fryzjer", "malarz", "piłka", "bramka", "rower", "narty", "basen", "złoto", "srebro", "diament", "pieniądze", "portfel", "torba", "plecak", "walizka", "szczoteczka", "mydło", "lustro", "ręcznik", "grzebień", "nożyczki", "ołówek", "długopis", "gumka", "zeszyt", "linijka", "pudełko", "prezent", "balon", "tort", "świeczka", "flaga", "mapa", "kompas", "lornetka"



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

    // Handling players
    void addPlayer(crow::websocket::connection &conn, std::string &playerName);
    Player *popNextDrawer();

    // Counter
    void startCountdown(int seconds);
    void stopCountdown();

    // JSON communication
    void broadcastAll(const json &packet) const;
    static void sendJson(crow::websocket::connection *conn, const json &packet);
    void broadcastExcept(const crow::websocket::connection *conn, const json &packet) const;

    // Words selection
    Guessing checkGuess(std::string &guess);
    [[nodiscard]] std::vector<std::string> drawThreeWordsFromPool();
    [[nodiscard]] bool selectWordFromChoices(const std::string& chosenWord);

    void prepareNewRoundQueue();





    // Setters
    void setGuessingWord(const std::string &word);
    void initWordPool(const std::vector<std::string>& words);
    void setPlayerArray(json &playersArray) const;

    // Getters
    Player *getCurrentDrawer();
    [[nodiscard]] bool isEndGame() const;
    [[nodiscard]] int getPlayersCount() const;
    [[nodiscard]] bool is_round_ends();
    [[nodiscard]] bool is_drawStackEmpty() const;
    [[nodiscard]] std::string getPin() const;
    [[nodiscard]] int getRoundTime() const;
    [[nodiscard]] const std::string& getSecretWord() const;

private:
    // State and room
    std::unique_ptr<IRoomState> currentState;
    crow::websocket::connection *hostConn{nullptr};
    std::string pin;

    // Players
    std::vector<Player> players;
    std::vector<size_t> drawStack;

    // Words
    std::vector<std::string> wordsPool{MOCK_WORDS};
    std::vector<std::string> backupWordsPool{MOCK_WORDS};
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

    void roundCountdownWorker(const std::stop_token &stoken, int seconds);
};

#endif //GAMESERVER_ROOM_HPP
