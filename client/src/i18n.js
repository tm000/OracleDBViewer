import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      "connections": "connections",
      "tables": "tables",
      "execute": "execute",
      "new": "new",
      "Connection Settings": "Connection Settings",
      "New Connection Settings": "New Connection Settings",
      "Connection Name": "Connection Name",
      "User Id": "User Id",
      "Password": "Password",
      "DataBase Name": "DataBase Name",
      "Cancel": "Cancel",
      "Add": "Add",
      "Edit": "Edit",
      "Delete": "Delete",
      "Apply": "Apply",
      "An error has occurred": "An error has occurred.",
      "An unexpected error has occurred": "An unexpected error has occurred.",
      "Execution failed on sql": "Execution failed on sql.",
      "Enter connection information": "Please enter connection information",
      "Delete confirm message": "Are you sure you want to delete this item?",
      "Failed to get table list": "Failed to get table list.",
      "Already exists": " already exists.",
    }
  },
  ja: {
    translation: {
      "connections": "接続",
      "tables": "テーブル",
      "execute": "実行",
      "new": "新しい",
      "Connection Settings": "接続設定",
      "New Connection Settings": "新しい接続設定",
      "Connection Name": "接続名",
      "User Id": "ユーザID",
      "Password": "パスワード",
      "DataBase Name": "データベース名",
      "Cancel": "キャンセル",
      "Add": "追加",
      "Edit": "変更",
      "Delete": "削除",
      "Apply": "反映",
      "An error has occurred": "エラーが発生しました。",
      "An unexpected error has occurred": "予期せぬエラーが発生しました。",
      "Execution failed on sql": "SQLの実行に失敗しました。",
      "Enter connection information": "値を入力してください。",
      "Delete confirm message": "本当に削除してよろしいですか？",
      "Failed to get table list": "テーブル一覧の取得に失敗しました。",
      "Already exists": "はすでに存在します。",
      "Select connection name": "接続名を選択してください。",
      "Enter SQL": "SQLを入力してください。",
    }
  }
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    interpolation: {
      escapeValue: false
    }
  });

  export default i18n;