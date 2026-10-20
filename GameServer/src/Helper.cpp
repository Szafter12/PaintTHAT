#include "../include/Helper.hpp"

std::string Helper::normalizeForComparison(std::string s) {
    // 1. ASCII A-Z -> a-z
    std::ranges::transform(s, s.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });

    // 2. Polskie znaki (wielkie i małe) -> odpowiedniki ASCII bez ogonków
    static const std::vector<std::pair<std::string, std::string>> diacriticsMap = {
        {"Ą", "a"}, {"ą", "a"}, {"Ć", "c"}, {"ć", "c"}, {"Ę", "e"}, {"ę", "e"},
        {"Ł", "l"}, {"ł", "l"}, {"Ń", "n"}, {"ń", "n"}, {"Ó", "o"}, {"ó", "o"},
        {"Ś", "s"}, {"ś", "s"}, {"Ź", "z"}, {"ź", "z"}, {"Ż", "z"}, {"ż", "z"}
    };

    for (const auto& [pl, ascii] : diacriticsMap) {
        size_t pos = 0;
        while ((pos = s.find(pl, pos)) != std::string::npos) {
            s.replace(pos, pl.length(), ascii);
            pos += ascii.length();
        }
    }

    return s;
}