

# 🧠  Selfbot

> ⚠️ **Disclaimer:** This selfbot is for **educational & authorized** use only. Running a selfbot **violates Discord ToS** and can result in account termination.

## 📦 Features

* 🔨 Mass ban/kick members 
* 📬 DM all members
* 📋 Fetch server/user info
* 🌀 Clone:

  * Emojis
  * Stickers
  * Channels
  * Roles
* 🔁 `nukeclone` – wipe channels & copy from another server
* 📩 Get instant invite to a server

## 🚀 Setup

1.**Get the code from github**

  ```bash
  git clone https://github.com/sidx0/selfbot-basic
  cd selfbot-basic
  ```

2. **Install dependencies:**

   ```bash
   npm install discord.js-selfbot-v13
   ```

3. **Edit config:**

   ```js
   const config = {
     token: "YOUR_TOKEN",
     prefix: "!",
     ownerID: "YOUR_USER_ID",
     logChannelID: null
   };
   ```

4. **Run the bot:**
   ```bash
   node app.js
   ```

## 📘 Commands

| Command                           | Description                               |
| --------------------------------- | ----------------------------------------- |
| `!help`                           | Show help menu                            |
| `!serverinfo`                     | Server stats                              |
| `!userinfo [@user]`               | User info                                 |
| `!getinvite <serverID>`           | Generate invite                           |
| `!banall [reason]`                | Ban all bannable users                    |
| `!kickall [reason]`               | Kick all kickable users                   |
| `!dmall <message>`                | DM all users                              |
| `!clone emoji <srcID> <dstID>`    | Clone emojis                              |
| `!clone sticker <srcID> <dstID>`  | Clone stickers                            |
| `!clone channels <srcID> <dstID>` | Clone channels                            |
| `!clone roles <srcID> <dstID>`    | Clone roles                               |
| `!nukeclone <srcID> <dstID>`      | Delete all channels and clone from source |

## 🧠 Note

* Requires you to be a member of both source and target guilds.
* Cloning respects rate limits (1s delay).
* Make sure you have permissions in both servers.


