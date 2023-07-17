#include <cex.hpp>
#include <cex/session.hpp>
#include <cex/security.hpp>
#include <cex/filesystem.hpp>
#include <cex/basicauth.hpp>
#include <cex/util.hpp>
#include <fcntl.h>
#include <fstream>
#include <unistd.h>
#include <csignal>
#include <stdlib.h>
#include <sqlcpr.h>
#include "DBBase.cpp"
#include "output/OutputWriter.cpp"
#include <iostream>
#include <nlohmann/json.hpp>

using namespace std;
using namespace nlohmann;

volatile sig_atomic_t exitRequested = 0;

typedef std::function<void(cex::Request* req, cex::Response* res, std::function<void()> next, DBBase* db)> MyMiddlewareFunction;

class MyServer {
   cex::Server svr;
   DBBase db = DBBase(stdout);
public:
   MyServer() : svr() {}

   void use(char *path, MyMiddlewareFunction func) {
      svr.use(path, [=](cex::Request* req, cex::Response* res, std::function<void()> next) {
         func(req, res, next, &db);
      });
   }

   void use(char *path, cex::MiddlewareFunction func) {
      svr.use(path, func);
   }

   void use(cex::MiddlewareFunction func) {
      svr.use(func);
   }
   
   void get(char *path, cex::MiddlewareFunction func, int flags = 1) {
      svr.get(path, func, flags);
   }

   void post(char *path, MyMiddlewareFunction func) {
      svr.post(path, [=](cex::Request* req, cex::Response* res, std::function<void()> next) {
         func(req, res, next, &db);
      });
   }

   void uploads(char *path, cex::UploadFunction func, cex::Method method = cex::methodPOST, int flags = 1) {
      svr.uploads(path, func, method, flags);
   }

   void listen(std::string address, int port, bool block) {
      svr.listen(address, port, block);
   }

   void stop() {
      svr.stop();
      db.disconnect();
   }

   ~MyServer() {
      std::cout << "MyServer Received SIGTERM signal. Cleaning up and terminating..." << std::endl;
   }
};

MyServer app;

void signal_handler(int signum)
{
    exitRequested = 1;
    app.stop();
}

int main()
{
   signal(SIGINT, signal_handler);
   app.post("/api", [](cex::Request* req, cex::Response* res, std::function<void()> next, DBBase* db) {
      if (req->getBodyLength() > 0) {
         char *bodystr = (char*)malloc(req->getBodyLength()+1);
         strncpy(bodystr, req->getBody(), req->getBodyLength());
         bodystr[req->getBodyLength()] = '\0';
         auto jsonstr = json::parse(bodystr);
         free(bodystr);
         if (jsonstr.contains("sql") && jsonstr.contains("username") && jsonstr.contains("password") && jsonstr.contains("dbname")) {
            JsonWriter writer;
            int ret = db->connect(writer, jsonstr["username"].get<string>().c_str(),
                                          jsonstr["password"].get<string>().c_str(),
                                          jsonstr["dbname"].get<string>().c_str());
            if (ret == 0) {
               ret = db->execute(writer, jsonstr["sql"].get<string>().c_str());
            };
            // writer.save("updated_data.json");
            res->setFlags(res->getFlags() | cex::Response::fCompressGZip);
            res->set("Access-Control-Allow-Origin", "*");
            res->set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res->set("Access-Control-Allow-Headers", "Content-Type");
            res->set("Content-Type", "application/json; charset=utf-8");
            // printf("%s\n", writer.getJson().c_str());
            res->end(writer.getJson().c_str(), strlen(writer.getJson().c_str()), ret == 0 ? 200 : 400);
         } else
            res->end(400);
         return;
      }
      res->end(200);
   });
   app.use("/close", [](cex::Request* req, cex::Response* res, std::function<void()> next, DBBase* db) {
      db->disconnect();
      res->end(200);
   });

   // use filesystem middleware
   std::shared_ptr<cex::FilesystemOptions> fsOpts(new cex::FilesystemOptions());
   fsOpts.get()->rootPath= "/tmp";
   
   app.use("/docs", cex::filesystem(fsOpts));
   
   // use security middleware with some options set
   std::shared_ptr<cex::SecurityOptions> secOpts(new cex::SecurityOptions());
   secOpts.get()->xFrameAllow= cex::xfFrom;
   secOpts.get()->xFrameFrom= "my.domain.de";
   secOpts.get()->stsMaxAge= 183400;
   
   secOpts.get()->ieNoOpen= cex::no;
   secOpts.get()->noDNSPrefetch= cex::no;

   app.use(cex::securityHeaders(secOpts));
   
   // use session middleware
   std::shared_ptr<cex::SessionOptions> sessionOpts(new cex::SessionOptions());
   sessionOpts.get()->expires = 60*60*24*3;
   sessionOpts.get()->maxAge= 144; 
   sessionOpts.get()->domain= "my.domain.de"; 
   sessionOpts.get()->path= "/somePath"; 
   sessionOpts.get()->name= "sessionID"; 
   sessionOpts.get()->secure= false; 
   sessionOpts.get()->httpOnly=true; 
   sessionOpts.get()->sameSiteLax= true; 
   sessionOpts.get()->sameSiteStrict= true;

   app.use(cex::sessionHandler(sessionOpts));
   
   // use basic auth middleware
   app.use(cex::basicAuth());
   app.use("/", [](cex::Request* req, cex::Response* res, std::function<void()> next)
   {
      string raw = "default";
      res->end(raw.c_str(), 200);
   });
  
   // start server
   std::cout << "Server started at 127.0.0.1:5555\n" << std::endl;

   app.listen("0.0.0.0", 5555, true);

   return 0;   
}