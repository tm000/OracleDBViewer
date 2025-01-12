#include <stdint.h>
#include <string.h>
#include <fstream>
#include <iostream>
#include <iomanip>
#include "OutputWriter.h"
#include "../util/StringUtil.h"

const int INT_TYPE = 3;
const int FLOAT_TYPE = 4;

void JsonWriter::processColumnHeader(const std::vector<std::string>& headers) {
    output << "{\"header\":[";
    errors.clear();

    bool first = true;
    for (const auto& header : headers) {
        if (!first) {
            output << ",";
        }
        first = false;
        std::string trimmed_header = header;
        trim(trimmed_header);
        output << "\"" << trimmed_header << "\"";
    }

    output << "],\"body\":[";
    first_record = true;
    json_freezed = false;
}

void JsonWriter::processBody(SQLDA* select_dp) {
    if (first_record) {
        output << "[";
        first_record = false;
    } else {
        output << ",[";
    }

    bool first_column = true;
    for (int i = 0; i < select_dp->F; i++)
    {
        if (first_column) {
            output << "\"";
            first_column = false;
        } else {
            output << ",\"";
        }

        if (*select_dp->I[i] < 0) {
            output << ""; // null
        } else {
            if (select_dp->T[i] == INT_TYPE) {         /* int datatype */
                output << std::to_string(*reinterpret_cast<int*>(select_dp->V[i]));
            } else if (select_dp->T[i] == FLOAT_TYPE) {  /* float datatype */
                output << std::to_string(*reinterpret_cast<float*>(select_dp->V[i]));
            } else {                            /* character string */
                select_dp->V[i][select_dp->L[i]] = '\0';
                std::string str(select_dp->V[i]);
                rtrim(str);
                escape_json(str);
                output << str;
            }
        }
        output << "\"";
    }
    output << "]";
}

void JsonWriter::error(const std::string& msg, ...) {
    char buf[256];
    va_list args;
    va_start(args, msg.c_str());
    vsnprintf(buf, sizeof(buf), msg.c_str(), args);
    va_end(args);
    std::string str(buf);
    rtrim(str);
    escape_json(str);
    errors.push_back(str);
}

void JsonWriter::freezeJson() {
    if (json_freezed) {
        return;
    }

    if (!errors.empty()) {
        output.str(""); // Clear output
        output << "{\"error\":[";
        for(size_t i = 0; i < errors.size(); ++i) {
            if (i > 0) {
                output << ",\"";
            } else {
                output << "\"";
            }
            output << errors[i] << "\"";
        }
    }

    output << "]}";
    json_str = output.str();
    json_freezed = true;
}

void JsonWriter::save(const std::string& path) {
    freezeJson();
    std::ofstream outputFile(path);
    if (outputFile.is_open()) {
        outputFile << json_str;
    }
}

std::string JsonWriter::getJson() {
    freezeJson();
    return json_str;
}

void PrintWriter::processColumnHeader(const std::vector<std::string>& headers) {
    // Implementation for processing column headers
}

void PrintWriter::processBody(SQLDA* select_dp) {
    std::ostringstream oss;
    for (int i = 0; i < select_dp->F; i++) {
       if (*select_dp->I[i] < 0) {
            if (select_dp->T[i] == FLOAT_TYPE) {
                oss << std::setw(static_cast<int>(select_dp->L[i]) + 3) << ' ';
            } else {
                oss << std::setw(static_cast<int>(select_dp->L[i])) << ' ';
            }
        } else {
            if (select_dp->T[i] == INT_TYPE) {           /* int datatype */
                oss << std::setw(static_cast<int>(select_dp->L[i])) 
                    << *reinterpret_cast<int*>(select_dp->V[i]) << ' ';
            } else if (select_dp->T[i] == FLOAT_TYPE) {      /* float datatype */
                oss << std::setw(static_cast<int>(select_dp->L[i])) 
                    << std::fixed << std::setprecision(2) 
                    << *reinterpret_cast<float*>(select_dp->V[i]) << ' ';
            } else {                               /* character string */
                oss << std::setw(static_cast<int>(select_dp->L[i])) 
                    << std::string(static_cast<char*>(select_dp->V[i]), static_cast<int>(select_dp->L[i])) << ' ';
            }
        }
    }
    oss << '\n';
    std::cout << oss.str();
};
