// SERVER-ONLY. Never import this file from a "use client" component —
// it contains plaintext credentials and must never reach the browser bundle.
//
// This is intentionally a lightweight, hardcoded credential store for a
// private two-person household app. It is not a hardened auth system.

const USERS = {
  Harris: {
    username: "Harris",
    password: "1405",
    role: "admin",
    displayName: "Harris",
  },

  Joe: {
    username: "Joe",
    password: "1405",
    role: "member",
    displayName: "Joe",
  },
};

export default USERS;
