#ifndef OUTPUTWRITER_H
#define OUTPUTWRITER_H

#define SQLCA_NONE 1
#define ORACA_NONE 1
#include <sqlda.h>
#include <vector>
#include <algorithm>

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
    ltrim(s);
    return rtrim(s); 
}

static inline char* rtrimc(char *s)
{
    char* last = s + strlen(s);
    while (*(--last) == ' ');
    *(last+1) = '\0';
    return s;
}

static std::string join(const std::vector<std::string>& v, const char* delim = 0) {
    std::string s;
    if (!v.empty()) {
        s += v[0];
        for (decltype(v.size()) i = 1, c = v.size(); i < c; ++i) {
            if (delim) s += delim;
            s += v[i];
        }
    }
    return s;
}

static inline std::string escape_json(std::string &s)
{
    /*
        \b  Backspace (ascii code 08)
        \f  Form feed (ascii code 0C)
        \n  New line
        \r  Carriage return
        \t  Tab
        \"  Double quote
        \\  Backslash character
    */
    char chars[] = "\b\f\n\r\t\"\\";
    for (unsigned int i = 0; i < s.size(); ++i)
        switch (s[i]) {
            case '\b':
                s.replace(i, 1, "\\b");
                ++i;
                break;
            case '\f':
                s.replace(i, 1, "\\f");
                ++i;
                break;
            case '\n':
                s.replace(i, 1, "\\n");
                ++i;
                break;
            case '\r':
                s.replace(i, 1, "\\r");
                ++i;
                break;
            case '\t':
                s.replace(i, 1, "\\t");
                ++i;
                break;
            case '\"':
                s.replace(i, 1, "\\\"");
                ++i;
                break;
            case '\\':
                s.replace(i, 1, "\\\\");
                ++i;
                break;
        }
    return s;
}

class OutputWriter {
public:
    virtual void processColumnHeader(std::vector<std::string>& headers) = 0;
    virtual void processBody(SQLDA* select_dp) = 0;
    virtual void error(char* msg, ...) = 0;
};

class JsonWriter : public OutputWriter {
private:
    std::vector<std::string> output;
    std::vector<std::string> errors;
    bool first_record = true;
    bool json_freezed = false;
    std::string json_str;

    void freezeJson();
public:
    void processColumnHeader(std::vector<std::string>& headers);

    void processBody(SQLDA* select_dp);

    void error(char* msg, ...);

    void save(char* path);

    std::string getJson();
};

class PrintWriter : public OutputWriter {
public:
    void processColumnHeader(std::vector<std::string>& headers);
    void processBody(SQLDA* select_dp);
};


#endif // OUTPUTWRITER_H
