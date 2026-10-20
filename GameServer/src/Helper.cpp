#include "../include/Helper.hpp"

std::string Helper::normalizeForComparison(std::string s) {
    std::ranges::transform(s, s.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });

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

int Helper::levenshtein_distance(const std::string &s1, const std::string &s2) {
    int n = s1.length();
    int m = s2.length();

    std::vector<int> prevRow(m + 1);
    std::vector<int> currRow(m + 1);

    for (int j = 0; j <= m; ++j) {
        prevRow[j] = j;
    }

    for (int i = 1; i <= n; ++i) {
        currRow[0] = i;

        for (int j = 1; j <= m; ++j) {
            int cost = (s1[i - 1] == s2[j - 1]) ? 0 : 1;

            currRow[j] = std::min({
                prevRow[j] + 1,
                currRow[j - 1] + 1,
                prevRow[j - 1] + cost
            });
        }
        prevRow = currRow;
    }

    return prevRow[m];
}