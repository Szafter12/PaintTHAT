#ifndef GAMESERVER_HELPER_HPP
#define GAMESERVER_HELPER_HPP

#include <vector>
#include <string>
#include <algorithm>
#include <array>

class Helper {
public:
    static std::string normalizeForComparison(std::string s);

    static int levenshtein_distance(const std::string &s1, const std::string &s2);
};


#endif //GAMESERVER_HELPER_HPP
