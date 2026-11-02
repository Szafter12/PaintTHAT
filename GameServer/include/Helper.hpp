#ifndef GAMESERVER_HELPER_HPP
#define GAMESERVER_HELPER_HPP

#include <vector>
#include <string>
#include <algorithm>
#include <array>

class Helper {
public:
    static std::string normalizeForComparison(std::string_view sv);

    static int levenshtein_distance(std::string_view s1, std::string_view s2);
};


#endif //GAMESERVER_HELPER_HPP
