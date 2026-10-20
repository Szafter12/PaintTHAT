cmake_minimum_required(VERSION 3.20)
project(GameServer CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

FetchContent_Declare(
        json
        GIT_REPOSITORY https://github.com/nlohmann/json.git
        GIT_TAG v3.11.3
)
FetchContent_MakeAvailable(json)

FetchContent_Declare(
        crow
        GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
        GIT_TAG v1.2.0
)

set(CROW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(CROW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(crow)

file(GLOB_RECURSE PROJECT_SOURCES CONFIGURE_DEPENDS
        "src/*.cpp"
)

find_package(Threads REQUIRED)

add_executable(${PROJECT_NAME} ${PROJECT_SOURCES}
        src/Helper.cpp
        include/Helper.hpp)

target_include_directories(${PROJECT_NAME} PRIVATE "include")

if (MSVC)
    target_compile_options(GameServer PRIVATE /utf-8)
endif ()

target_link_libraries(GameServer PRIVATE
        Crow::Crow
        nlohmann_json::nlohmann_json
        Threads::Threads
)

if (WIN32)
    target_link_libraries(GameServer PRIVATE ws2_32 wsock32)
endif ()