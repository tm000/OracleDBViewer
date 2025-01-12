#ifndef OUTPUTWRITER_H
#define OUTPUTWRITER_H

#define SQLCA_NONE 1
#define ORACA_NONE 1

#include <sqlda.h>
#include <vector>
#include <algorithm>
#include <sstream>

class OutputWriter {
public:
    virtual void processColumnHeader(const std::vector<std::string>& headers) = 0;
    virtual void processBody(SQLDA* select_dp) = 0;
    virtual void error(const std::string& msg, ...) = 0;
};

class JsonWriter : public OutputWriter {
private:
    std::ostringstream output;
    std::vector<std::string> errors;
    bool first_record = true;
    bool json_freezed = false;
    std::string json_str;

    void freezeJson();
public:
    void processColumnHeader(const std::vector<std::string>& headers);

    void processBody(SQLDA* select_dp);

    void error(const std::string& msg, ...);

    void save(const std::string& path);

    std::string getJson();
};

class PrintWriter : public OutputWriter {
public:
    void processColumnHeader(const std::vector<std::string>& headers);
    void processBody(SQLDA* select_dp);
};

#endif // OUTPUTWRITER_H
