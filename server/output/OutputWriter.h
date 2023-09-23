#ifndef OUTPUTWRITER_H
#define OUTPUTWRITER_H

#define SQLCA_NONE 1
#define ORACA_NONE 1
#include <sqlda.h>
#include <nlohmann/json.hpp>

static inline std::string ltrim(std::string &s)
{
    auto it = s.begin();
    while (it != s.end() && std::isspace(*it))
        ++it;
    s.erase(s.begin(), it);
    return s;
}

static inline std::string rtrim(std::string &s)
{
    auto it = s.end();
    while (it != s.begin() && std::isspace(*(it - 1)))
        --it;
    s.erase(it, s.end());
    return s;
}

static inline std::string trim(std::string &s)
{
    std::string tmp = ltrim(s);
    return rtrim(tmp); 
}

static inline char* rtrimc(char *s)
{
    char* last = s + strlen(s);
    while (*(--last) == ' ');
    *(last+1) = '\0';
    return s;
}

class OutputWriter {
public:
    virtual void processColumnHedaer(std::vector<std::string>& headers) = 0;
    virtual void processBody(SQLDA* select_dp) = 0;
    virtual void error(char* msg, ...) = 0;
};

class JsonWriter : public OutputWriter {
private:
    nlohmann::json output;
    std::vector<nlohmann::json> lines;
public:
    void processColumnHedaer(std::vector<std::string>& headers);

    void processBody(SQLDA* select_dp);

    void error(char* msg, ...);

    void save(char* path);

    std::string getJson();
};

class PrintWriter : public OutputWriter {
public:
    void processColumnHedaer(std::vector<std::string>& headers);
    void processBody(SQLDA* select_dp);
};


#endif // OUTPUTWRITER_H
