#include <stdint.h>
#include <string.h>
#include <fstream>
#include "OutputWriter.h"

using namespace std;

void JsonWriter::processColumnHedaer(vector<string>& headers) {
    output.clear();
    errors.clear();
    output.shrink_to_fit();
    errors.shrink_to_fit();
    output.push_back("{\"header\":[");
    for (int i = 0; i < headers.size(); i++) {
        if (i==0)
            output.push_back("\"");
        else
            output.push_back(",\"");
        trim(headers.at(i));
        const char* trimmed = headers.at(i).c_str();
        char* str = new char[strlen(trimmed)+1];
        strcpy(str, trimmed);
        output.push_back(str);
        output.push_back("\"");
    }
    output.push_back("],\"body\":[");
    first_record = true;
    json_freezed = false;
};

void JsonWriter::processBody(SQLDA* select_dp) {
    if (first_record) {
        output.push_back("[");
        first_record = false;
    } else
        output.push_back(",[");

    bool first_column = true;
    for (int i = 0; i < select_dp->F; i++)
    {
        if (first_column) {
            output.push_back("\"");
            first_column = false;
        } else
            output.push_back(",\"");

        if (*select_dp->I[i] < 0)
            if (select_dp->T[i] == 4)
                output.push_back(""); // null
            else
                output.push_back(""); // null
        else
            if (select_dp->T[i] == 3) {         /* int datatype */
                std::string str = std::to_string(*(int *)select_dp->V[i]);
                output.push_back(str);
            } else if (select_dp->T[i] == 4) {  /* float datatype */
                std::string str = std::to_string(*(float *)select_dp->V[i]);
                output.push_back(str);
            } else {                            /* character string */
                select_dp->V[i][select_dp->L[i]] = '\0';
                std::string str(select_dp->V[i]);
                rtrim(str);
                escape_json(str);
                output.push_back(str);
            }
        output.push_back("\"");
    }
    output.push_back("]");
};

void JsonWriter::error(char* msg, ...) {
    char buf[256];
    va_list args;
    va_start(args, msg);
    vsprintf(buf, msg, args);
    va_end(args);
    std::string str(buf);
    rtrim(str);
    escape_json(str);
    errors.push_back(str);
}

void JsonWriter::freezeJson() {
    if (json_freezed) return;

    if (errors.size() > 0) {
        output.clear();
        output.shrink_to_fit();
        output.push_back("{\"error\":[");
        for(int i = 0; i < errors.size(); i++) {
            if (i > 0)
                output.push_back(",\"");
            else
                output.push_back("\"");
            output.push_back(errors[i].c_str());
            output.push_back("\"");
        }
    }

    output.push_back("]}");
    json_str = join(output);
    json_freezed = true;
}

void JsonWriter::save(char* path) {
    freezeJson();
    std::ofstream outputFile(path);
    outputFile << json_str;
    outputFile.close();
}

string JsonWriter::getJson() {
    freezeJson();
    return json_str;
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
