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
    virtual void processDesc(SQLDA* select_dp) = 0;
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

    void processDesc(SQLDA* select_dp) {
        int i, j, n, null_ok, precision, scale;
        for (i = 0; i < select_dp->F; i++)
        {
            vector<string> line;
            char title[MAX_VNAME_LEN]; 
            memset(title, ' ', MAX_VNAME_LEN);
            strncpy(title, select_dp->S[i], select_dp->C[i]);
            line.push_back(title);

            SQLColumnNullCheck (SQL_SINGLE_RCTX, (unsigned short *)&(select_dp->T[i]), 
                (unsigned short *)&(select_dp->T[i]), &null_ok);

            char buf[16];
            switch (select_dp->T[i])
            {
                case  1 :
                    sprintf(buf, "VARCHAR2(%d)", select_dp->L[i]);
                    line.push_back(buf);
                    break;
                case  2 :
                    SQLNumberPrecV6( SQL_SINGLE_RCTX, 
                        (unsigned int *)&(select_dp->L[i]), &precision, &scale);
                    if (precision !=0 || scale != 0)
                        sprintf(buf, "NUMBER(%d,%d)", precision, scale);
                    else
                        sprintf(buf, "NUMBER");
                    line.push_back(buf);
                    break;
                case  12 :
                    line.push_back("DATE");
                    break;
                case  96 :
                    sprintf(buf, "CHAR(%d)", select_dp->L[i]);
                    line.push_back(buf);
                    break;
                case  112 :
                    line.push_back("CLOB");
                    break;
                case  187 :
                    line.push_back("TIMESTAMP");
                    break;
                case  188 :
                    line.push_back("TIMESTAMP(9) WITH TIME ZONE");
                    break;
                case  189 :
                    line.push_back("INTERVAL YEAR(4) TO MONTH");
                    break;
                case  190 :
                    line.push_back("INTERVAL DAY(4) TO SECOND(9)");
                    break;
                case  232 :
                    line.push_back("TIMESTAMP(9) WITH LOCAL TIME ZONE");
                    break;

                default:
                    line.push_back("?");
            }
            
            line.push_back(null_ok ? "Yes" : "No");
            lines.push_back(line);
        }

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
