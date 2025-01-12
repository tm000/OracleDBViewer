#ifndef STRINGUTIL_H
#define STRINGUTIL_H

#include <vector>
#include <algorithm>
#include <sstream>
#include <string.h>

static inline void ltrim(std::string &s)
{
    auto it = s.begin();
    while (it != s.end() && std::isspace(*it))
        ++it;
    s.erase(s.begin(), it);
}

static inline void rtrim(std::string &s)
{
    auto it = s.end();
    while (it != s.begin() && std::isspace(*(it - 1)))
        --it;
    s.erase(it, s.end());
}

static inline void trim(std::string& s)
{
    ltrim(s);
    rtrim(s); 
}

static inline char* rtrimc(char *s)
{
    char* last = s + strlen(s);
    while (*(--last) == ' ');
    *(last + 1) = '\0';
    return s;
}

static std::string join(const std::vector<std::string>& v, const char* delim = nullptr) {
    std::ostringstream s;
    if (!v.empty()) {
        s << v[0];
        for (decltype(v.size()) i = 1, c = v.size(); i < c; ++i) {
            if (delim) {
                s << delim;
            }
            s << v[i];
        }
    }
    return s.str();
}

static inline void escape_json(std::string &s)
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
    for (unsigned int i = 0; i < s.size(); ++i) {
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
    }
}

#endif // STRINGUTIL_H
