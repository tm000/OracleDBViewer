#include <stdint.h>
#include <string.h>
#include <fstream>
#include <nlohmann/json.hpp>
#include "OutputWriter.h"

using namespace std;

void JsonWriter::processColumnHedaer(vector<string>& headers) {
    vector<string> trimmed;
    for (int i = 0; i < headers.size(); i++) {
        trimmed.push_back(trim(headers.at(i)));
    }
    output["header"] = nlohmann::json(trimmed);
    output["body"] = lines;
};

void JsonWriter::processBody(SQLDA* select_dp) {
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

void JsonWriter::error(char* msg, ...) {
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

void JsonWriter::save(char* path) {
    std::ofstream outputFile(path);
    outputFile << output.dump(4);  // 4 is the indentation level
    outputFile.close();
}

string JsonWriter::getJson() {
    return output.dump().c_str();
}

void PrintWriter::processColumnHedaer(vector<string>& headers) {
    
};
void PrintWriter::processBody(SQLDA* select_dp) {
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
