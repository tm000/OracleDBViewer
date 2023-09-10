#ifndef __OUTPUTWRITER_CPP__
#define __OUTPUTWRITER_CPP__

#include <sqlda.h>
#include <stdint.h>
#include <string.h>
#include <nlohmann/json.hpp>

using namespace std;

#define MAX_VNAME_LEN     30

string ltrim(string &s)
{
    auto it = s.begin();
    while (it != s.end() && std::isspace(*it))
        ++it;
    s.erase(s.begin(), it);
    return s;
}

string rtrim(string &s)
{
    auto it = s.end();
    while (it != s.begin() && std::isspace(*(it - 1)))
        --it;
    s.erase(it, s.end());
    return s;
}

string trim(string &s)
{
    string tmp = ltrim(s);
    return rtrim(tmp); 
}

char* rtrimc(char *s)
{
    char* last = s + strlen(s);
    while (*(--last) == ' ');
    *(last+1) = '\0';
    return s;
}

class OutputWriter {
public:
    virtual void processColumnHedaer(vector<string>& headers) = 0;
    virtual void processBody(SQLDA* select_dp) = 0;
    virtual void error(char* msg, ...) = 0;
};

class JsonWriter : public OutputWriter {
private:
    nlohmann::json output;
    std::vector<nlohmann::json> lines;
public:
    void processColumnHedaer(vector<string>& headers) {
        vector<string> trimmed;
        for (int i = 0; i < headers.size(); i++) {
            trimmed.push_back(trim(headers.at(i)));
        }
        output["header"] = nlohmann::json(trimmed);
        output["body"] = lines;
    };

    void processBody(SQLDA* select_dp) {
        union {
            uint32_t u32;
            uint8_t bytes[4];
        } ms_converter;
        vector<string> line;
        for (int i = 0; i < select_dp->F; i++) {
            if (*select_dp->I[i] < 0)
                if (select_dp->T[i] == 4) 
                  line.push_back("");
                else
                  line.push_back("");
            else
                if (select_dp->T[i] == 3)           /* int datatype */
                    line.push_back(std::to_string(*(int *)select_dp->V[i]));
                else if (select_dp->T[i] == 4)      /* float datatype */
                    line.push_back(std::to_string(*(float *)select_dp->V[i]));
                else {                              /* character string */
                    select_dp->V[i][select_dp->L[i]] = '\0';
                    line.push_back(rtrimc(select_dp->V[i]));
                }
        }
        lines.push_back(line);
        output["body"] = lines;
    };

    void error(char* msg, ...) {
        char buf[256];
        va_list args;
        va_start(args, msg);
        vsprintf(buf, msg, args);
        va_end(args);
        if (!output.contains("error")) {
            vector<string> errors;
            errors.push_back(rtrimc(buf));
            output["error"] = errors;
        } else {
            auto errors = output["error"];
            errors.push_back(rtrimc(buf));
            output["error"] = errors;
        }
    }

    void save(char* path) {
        std::ofstream outputFile(path);
        outputFile << output.dump(4);  // 4 is the indentation level
        outputFile.close();
    }

    string getJson() {
        return output.dump().c_str();
    }
};

class PrintWriter : public OutputWriter {
public:
    void processColumnHedaer(vector<string>& headers) {
        
    };
    void processBody(SQLDA* select_dp) {
        for (int i = 0; i < select_dp->F; i++)
        {
            if (*select_dp->I[i] < 0)
                if (select_dp->T[i] == 4)
                  printf ("%-*c ",(int)select_dp->L[i]+3, ' ');
                else
                  printf ("%-*c ",(int)select_dp->L[i], ' ');
            else
                if (select_dp->T[i] == 3)           /* int datatype */
                  printf ("%*d ", (int)select_dp->L[i], 
                                 *(int *)select_dp->V[i]);
                else if (select_dp->T[i] == 4)      /* float datatype */
                  printf ("%*.2f ", (int)select_dp->L[i], 
                                 *(float *)select_dp->V[i]);
                else                                /* character string */
                  printf ("%-*.*s ", (int)select_dp->L[i],
                    (int)select_dp->L[i], select_dp->V[i]);
        }
        printf ("\n");
    };
};

#endif // __OUTPUTWRITER_CPP__
