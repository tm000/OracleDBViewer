#define SQLCA_NONE 1
#define ORACA_NONE 1

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
#include <cstdlib>
#include <iostream>
#include <nlohmann/json.hpp>
#include <functional>
#include <atomic>

#include "DBBase.h"
#include "output/OutputWriter.h"

using json = nlohmann::json;
using MyMiddlewareFunction = std::function<void(cex::Request* req, cex::Response* res, std::function<void()> next, DBBase* db)>;

class MyServer {
   cex::Server svr;
   DBBase db;
public:
   MyServer() : svr() {}

   void use(const std::string& path, const MyMiddlewareFunction& func) {
      svr.use(path.c_str(), [=](cex::Request* req, cex::Response* res, std::function<void()> next) {
         bool donext = false;
         func(req, res, [&donext]() { donext = true; }, &db);
         if (donext) {
            next();
         }
      });
   }

   void use(const std::string& path, const cex::MiddlewareFunction& func) {
      svr.use(path.c_str(), func);
   }

   void use(const cex::MiddlewareFunction& func) {
      svr.use(func);
   }
   
   void get(const std::string& path, const cex::MiddlewareFunction& func, int flags = 1) {
      svr.get(path.c_str(), func, flags);
   }

   void post(const std::string& path, const MyMiddlewareFunction& func) {
      svr.post(path.c_str(), [=](cex::Request* req, cex::Response* res, std::function<void()> next) {
         bool donext = false;
         func(req, res, [&donext]() { donext = true; }, &db);
         if (donext) {
            next();
         }
      });
   }

   void uploads(const std::string& path, const cex::UploadFunction& func, cex::Method method = cex::methodPOST, int flags = 1) {
      svr.uploads(path.c_str(), func, method, flags);
   }

   void listen(const std::string& address, int port, bool block) {
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

std::unique_ptr<MyServer> app = std::make_unique<MyServer>();
std::atomic<bool> exitRequested = false;

void signal_handler(int signum) {
    exitRequested = true;
    app->stop();
}

int main() {
   std::signal(SIGINT, signal_handler);

   app->use("/api", [](cex::Request* req, cex::Response* res, std::function<void()> next, DBBase* db) {
      res->setFlags(res->getFlags() | cex::Response::fCompressGZip);
      // set CORS headers
      res->set("Access-Control-Allow-Origin", "*");
      res->set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res->set("Access-Control-Allow-Headers", "Content-Type");
      next();
   });

   app->post("/api", [](cex::Request* req, cex::Response* res, std::function<void()> next, DBBase* db) {
      if (req->getBodyLength() == 0) {
         res->end(200);
         return;
      }

      std::string bodystr(req->getBody(), req->getBodyLength());
      auto jsonstr = json::parse(bodystr);
      const std::array<std::string_view, 5> required_keys = {"sql", "username", "password", "dbname", "role"};
      if (!std::all_of(required_keys.begin(), required_keys.end(), [&jsonstr](std::string_view key) { return jsonstr.contains(key); })) {
         fprintf(stderr, "\nInvalid argument\n");
         res->end(400);
         return;
      }

      auto writer = std::make_unique<JsonWriter>();
      int ret = db->connect(*writer, jsonstr["username"].get<std::string>().c_str(),
                                    jsonstr["password"].get<std::string>().c_str(),
                                    jsonstr["dbname"].get<std::string>().c_str(),
                                    jsonstr["role"].get<std::string>().c_str());
      if (ret == 0) {
         ret = db->execute(*writer, jsonstr["sql"].get<std::string>().c_str());
      };
      std::string jsonResponse = writer->getJson();
      res->set("Content-Type", "application/json; charset=utf-8");
      res->end(jsonResponse.c_str(), jsonResponse.size(), ret == 0 ? 200 : ret == -1 ? 400 : 500);
   });

   app->use("/close", [](cex::Request* req, cex::Response* res, std::function<void()> next, DBBase* db) {
      db->disconnect();
      res->end(200);
   });

   // use filesystem middleware
   auto fsOpts = std::make_shared<cex::FilesystemOptions>();
   fsOpts->rootPath = "/tmp";
   app->use("/docs", cex::filesystem(fsOpts));
   
   // use security middleware with some options set
   auto secOpts = std::make_shared<cex::SecurityOptions>();
   secOpts->xFrameAllow = cex::xfFrom;
   secOpts->xFrameFrom = "my.domain.de";
   secOpts->stsMaxAge = 183400;
   secOpts->ieNoOpen = cex::no;
   secOpts->noDNSPrefetch = cex::no;
   app->use(cex::securityHeaders(secOpts));
   
   // use session middleware
   auto sessionOpts = std::make_shared<cex::SessionOptions>();
   sessionOpts->expires = 60 * 60 * 24 * 3;
   sessionOpts->maxAge = 144;
   sessionOpts->domain = "my.domain.de";
   sessionOpts->path = "/somePath";
   sessionOpts->name = "sessionID";
   sessionOpts->secure = false;
   sessionOpts->httpOnly = true;
   sessionOpts->sameSiteLax = true;
   sessionOpts->sameSiteStrict = true;
   app->use(cex::sessionHandler(sessionOpts));
   
   // use basic auth middleware
   app->use(cex::basicAuth());
   app->use("/", [](cex::Request* req, cex::Response* res, std::function<void()> next) {
      const std::string raw = "default";
      res->end(raw.c_str(), 200);
   });
  
   // start server
   const char* portstr = std::getenv("ORACLE_DB_VIEWER_PORT");
   int port = portstr ? std::stoi(portstr) : 5555;
   std::cout << "Server started at 127.0.0.1:" << port << std::endl;

   app->listen("0.0.0.0", port, true);

   return 0;   
}