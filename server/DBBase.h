#ifndef DBBASE_H
#define DBBASE_H

#include <sqlca.h>
#include <sqlda.h>
#include <sqlcpr.h>
#include "output/OutputWriter.h"

struct connection {
    char* uname;
    char* pswd;
    char* dbname;
};

class DBBase
{
private:
    bool isDBOpen = false;
    struct connection current;
public:
    DBBase();
    virtual ~DBBase();

    int connect(OutputWriter& writer, const char* uname, const char* pswd, const char* dbname);

    void disconnect();

    int execute(OutputWriter& writer, const char* sql, ...);
};

#endif // DBBASE_H
